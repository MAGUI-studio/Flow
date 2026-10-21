import type { Prisma } from "@/generated/prisma/client";
import { owned } from "./business-write";
import {
  blockSchema,
  noteSchema,
  rescheduleSchema,
  seriesSchema,
} from "./scheduling-schemas";
import {
  localInstant,
  notifyWorkflow,
  releaseBooking,
  reserve,
} from "./reservations";
import { dayKey } from "./format";
import { getAvailability } from "./availability";

export async function createBlock(
  tx: Prisma.TransactionClient,
  actor: string,
  raw: unknown,
) {
  const input = blockSchema.parse(raw);
  const e = await owned(tx, actor, input.establishmentId);
  if (
    input.professionalIds.length &&
    (await tx.professional.count({
      where: { id: { in: input.professionalIds }, establishmentId: e.id },
    })) !== new Set(input.professionalIds).size
  )
    throw Error("FORBIDDEN");
  const startsAt = await localInstant(
    tx,
    input.fromDate,
    input.allDay ? "00:00" : input.fromTime,
    e.timezone,
  );
  let endDate = input.toDate;
  if (input.allDay) {
    const d = new Date(endDate + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    endDate = d.toISOString().slice(0, 10);
  }
  const endsAt = await localInstant(
    tx,
    endDate,
    input.allDay ? "00:00" : input.toTime,
    e.timezone,
  );
  if (endsAt <= startsAt) throw Error("INVALID_INPUT");
  const conflicts = await tx.booking.findMany({
    where: {
      OR: [
        { status: "confirmed" },
        { status: "pending", expiresAt: { gt: new Date() } },
      ],
      session: {
        establishmentId: e.id,
        ...(input.professionalIds.length
          ? { professionalId: { in: input.professionalIds } }
          : {}),
        occupiedStart: { lt: endsAt },
        occupiedEnd: { gt: startsAt },
      },
    },
    include: { session: { include: { service: true, professional: true } } },
  });
  if (
    conflicts.length &&
    (!input.cancelConflicts ||
      conflicts
        .map((b) => b.id)
        .sort()
        .join() !== [...input.conflictIds].sort().join())
  )
    return {
      conflicts: conflicts.map((b) => ({
        id: b.id,
        startsAt: b.session.startsAt,
        service: b.session.service.name,
        professional: b.session.professional.name,
      })),
    };
  for (const b of conflicts) await releaseBooking(tx, b.id);
  const block = await tx.scheduleBlock.create({
    data: {
      establishmentId: e.id,
      professionalIds: input.professionalIds,
      startsAt,
      endsAt,
      reason: input.reason,
    },
  });
  await tx.auditEvent.create({
    data: {
      actorId: actor,
      establishmentId: e.id,
      action: "schedule.block_created",
    },
  });
  return { block, conflicts: [] };
}
export async function saveCustomerNote(
  tx: Prisma.TransactionClient,
  actor: string,
  raw: unknown,
  id?: string,
) {
  const input = noteSchema.parse(raw);
  await owned(tx, actor, input.establishmentId);
  if (
    !(await tx.booking.count({
      where: {
        consumerId: input.consumerId,
        session: { establishmentId: input.establishmentId },
      },
    }))
  )
    throw Error("FORBIDDEN");
  if (id) {
    const previous = await tx.customerNote.findFirst({
      where: {
        id,
        establishmentId: input.establishmentId,
        consumerId: input.consumerId,
      },
    });
    if (!previous) throw Error("FORBIDDEN");
    return tx.customerNote.update({
      where: { id },
      data: { content: input.content },
    });
  }
  return tx.customerNote.create({ data: input });
}
export async function requestReschedule(
  tx: Prisma.TransactionClient,
  actor: string,
  bookingId: string,
  raw: unknown,
) {
  const input = rescheduleSchema.parse(raw);
  const first = await tx.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { session: { include: { establishment: true } } },
  });
  const e = first.session.establishment;
  const consumer = first.consumerId;
  const owner = actor === e.ownerId;
  if (!owner && consumer !== actor) throw Error("FORBIDDEN");
  await tx.$queryRaw`SELECT id FROM accounts WHERE id=${consumer} FOR UPDATE`;
  if (owner) await owned(tx, actor, e.id);
  await tx.$queryRaw`SELECT id FROM establishments WHERE id=${e.id}::uuid FOR UPDATE`;
  const b = await tx.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { session: true },
  });
  if (b.consumerId !== consumer) throw Error("FORBIDDEN");
  if (
    b.status !== "confirmed" ||
    b.session.startsAt.getTime() - Date.now() <
      (owner ? 0 : e.cancelNoticeHours * 3600000)
  )
    throw Error("CANCELLATION_DEADLINE");
  if (
    await tx.rescheduleRequest.count({
      where: { bookingId, status: "pending" },
    })
  )
    throw Error("RESCHEDULE_PENDING");
  if (
    b.session.professionalId === input.professionalId &&
    b.session.startsAt.toISOString() === new Date(input.startsAt).toISOString()
  )
    throw Error("INVALID_INPUT");
  const target = await reserve(tx, {
    consumerId: consumer,
    serviceId: b.session.serviceId,
    professionalId: input.professionalId,
    startsAt: new Date(input.startsAt),
    phone: b.whatsapp ?? "",
    ignoreBookingId: b.id,
    purpose: "reschedule",
    seriesId: b.seriesId ?? undefined,
  });
  const manual = e.approvalMode === "manual" && !owner;
  const expiresAt = new Date(
    Math.min(
      Date.now() + 24 * 3600000,
      target.session.startsAt.getTime(),
      b.session.startsAt.getTime() - e.cancelNoticeHours * 3600000,
    ),
  );
  if (manual && expiresAt <= new Date()) throw Error("CANCELLATION_DEADLINE");
  await tx.rescheduleRequest.create({
    data: {
      bookingId,
      targetBookingId: target.id,
      status: manual ? "pending" : "approved",
      expiresAt,
    },
  });
  if (manual)
    await tx.booking.update({ where: { id: target.id }, data: { expiresAt } });
  else {
    await releaseBooking(tx, b.id);
    await tx.booking.update({
      where: { id: target.id },
      data: { purpose: "normal", status: "confirmed", expiresAt: null },
    });
  }
  for (const account of [consumer, e.ownerId])
    await notifyWorkflow(
      tx,
      account,
      `reschedule:${target.id}:${account}`,
      manual ? "Reagendamento solicitado" : "Agendamento reagendado",
      manual
        ? "O horário original está mantido até a aprovação da mudança."
        : "Confira a nova data e o profissional do seu atendimento.",
      account === consumer
        ? "/agendamentos"
        : `/painel/reagendamentos?estabelecimento=${e.id}`,
    );
  await tx.auditEvent.create({
    data: {
      actorId: actor,
      establishmentId: e.id,
      bookingId,
      action: "booking.reschedule_requested",
    },
  });
  return { pending: manual, bookingId: target.id };
}
export async function decideReschedule(
  tx: Prisma.TransactionClient,
  actor: string,
  id: string,
  approve: boolean,
) {
  const first = await tx.rescheduleRequest.findUniqueOrThrow({ where: { id } });
  const original = await tx.booking.findUniqueOrThrow({
    where: { id: first.bookingId },
    include: { session: true },
  });
  const e = await owned(tx, actor, original.session.establishmentId);
  const r = await tx.rescheduleRequest.findUniqueOrThrow({ where: { id } });
  const target = await tx.booking.findUniqueOrThrow({
    where: { id: r.targetBookingId },
    include: { session: true },
  });
  if (
    r.status !== "pending" ||
    r.expiresAt <= new Date() ||
    target.status !== "pending"
  )
    throw Error("BOOKING_CLOSED");
  const current = await tx.booking.findUniqueOrThrow({
    where: { id: r.bookingId },
  });
  if (current.status !== "confirmed") throw Error("BOOKING_CLOSED");
  await tx.rescheduleRequest.update({
    where: { id },
    data: { status: approve ? "approved" : "declined" },
  });
  if (approve) {
    await releaseBooking(tx, original.id);
    await tx.booking.update({
      where: { id: target.id },
      data: { status: "confirmed", purpose: "normal", expiresAt: null },
    });
  } else await releaseBooking(tx, target.id, "declined");
  await notifyWorkflow(
    tx,
    original.consumerId,
    `reschedule-decision:${id}`,
    approve ? "Reagendamento aprovado" : "Reagendamento não aprovado",
    approve
      ? "Seu novo horário já está confirmado."
      : "Seu agendamento original continua confirmado.",
    "/agendamentos",
  );
  await tx.auditEvent.create({
    data: {
      actorId: actor,
      establishmentId: e.id,
      bookingId: original.id,
      action: approve ? "booking.rescheduled" : "booking.reschedule_declined",
    },
  });
}
export async function createSeries(
  tx: Prisma.TransactionClient,
  actor: string,
  raw: unknown,
  preview: boolean,
) {
  const input = seriesSchema.parse(raw);
  await tx.$queryRaw`SELECT id FROM accounts WHERE id=${input.consumerId} FOR UPDATE`;
  const e = await owned(tx, actor, input.establishmentId);
  if (
    !(await tx.booking.count({
      where: {
        consumerId: input.consumerId,
        session: { establishmentId: e.id },
      },
    }))
  )
    throw Error("FORBIDDEN");
  const service = await tx.service.findFirst({
    where: {
      id: input.serviceId,
      establishmentId: e.id,
      active: true,
      professionals: { some: { professionalId: input.professionalId } },
    },
  });
  if (!service) throw Error("SERVICE_UNAVAILABLE");
  const occurrences = [];
  for (let i = 0; i < input.count; i++) {
    const d = new Date(input.fromDate + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + i * input.intervalWeeks * 7);
    const date = d.toISOString().slice(0, 10);
    if (input.untilDate && date > input.untilDate) break;
    const startsAt = await localInstant(tx, date, input.time, e.timezone);
    const available = await getAvailability(
      service.id,
      input.professionalId,
      date,
      tx,
      input.consumerId,
    );
    occurrences.push({
      date,
      startsAt,
      excluded: input.excludedDates.includes(date),
      available: available.slots.some(
        (s) => s.startsAt === startsAt.toISOString(),
      ),
    });
  }
  if (preview) return { occurrences };
  const selected = occurrences.filter((o) => !o.excluded);
  if (!selected.length || selected.some((o) => !o.available))
    throw Error("SERIES_CONFLICT");
  const series = await tx.bookingSeries.create({
    data: {
      establishmentId: e.id,
      consumerId: input.consumerId,
      serviceId: input.serviceId,
      professionalId: input.professionalId,
      intervalWeeks: input.intervalWeeks,
    },
  });
  const ids = [];
  for (const o of selected) {
    const b = await reserve(tx, {
      consumerId: input.consumerId,
      serviceId: service.id,
      professionalId: input.professionalId,
      startsAt: o.startsAt,
      phone: input.phone,
      seriesId: series.id,
    });
    await tx.booking.update({
      where: { id: b.id },
      data: { status: "confirmed", expiresAt: null },
    });
    ids.push(b.id);
  }
  await notifyWorkflow(
    tx,
    input.consumerId,
    `series:${series.id}`,
    "Seus próximos atendimentos estão marcados",
    `${ids.length} atendimentos confirmados. Consulte todas as datas na sua agenda.`,
    "/agendamentos",
  );
  await tx.auditEvent.create({
    data: {
      actorId: actor,
      establishmentId: e.id,
      action: "booking.series_created",
    },
  });
  return { occurrences, id: series.id, count: ids.length };
}

export async function replaceSeries(
  tx: Prisma.TransactionClient,
  actor: string,
  id: string,
  fromBookingId: string,
  raw: unknown,
  preview: boolean,
) {
  const input = seriesSchema.parse(raw);
  await tx.$queryRaw`SELECT id FROM accounts WHERE id=${input.consumerId} FOR UPDATE`;
  const series = await tx.bookingSeries.findUniqueOrThrow({ where: { id } });
  await owned(tx, actor, series.establishmentId);
  if (
    input.establishmentId !== series.establishmentId ||
    input.consumerId !== series.consumerId ||
    input.serviceId !== series.serviceId
  )
    throw Error("FORBIDDEN");
  const from = await tx.booking.findFirst({
    where: { id: fromBookingId, seriesId: id },
    include: { session: true },
  });
  if (!from || from.session.startsAt <= new Date())
    throw Error("BOOKING_CLOSED");
  const rows = await tx.booking.findMany({
    where: {
      seriesId: id,
      session: { startsAt: { gte: from.session.startsAt, gt: new Date() } },
      status: { in: ["confirmed", "pending"] },
    },
  });
  await tx.$executeRaw`SELECT set_config('flow.silent_notifications','on',true)`;
  // Preview may release old slots only inside a savepoint, never persisting those changes.
  if (preview) await tx.$executeRawUnsafe("SAVEPOINT preview_series");
  for (const b of rows) await releaseBooking(tx, b.id);
  const result = await createSeries(tx, actor, input, preview);
  if (preview)
    await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT preview_series");
  else {
    await notifyWorkflow(
      tx,
      series.consumerId,
      `series-change:${id}:${fromBookingId}`,
      "Sua sequência de atendimentos foi atualizada",
      "Confira as novas datas e horários. Os atendimentos anteriores à mudança foram mantidos.",
      "/agendamentos",
    );
    await tx.auditEvent.create({
      data: {
        actorId: actor,
        establishmentId: series.establishmentId,
        action: "booking.series_changed",
      },
    });
  }
  return result;
}
