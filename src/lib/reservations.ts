import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { getAvailability } from "./availability";
import { dayKey } from "./format";
import { whatsappSchema } from "./form-schemas";

// Caller locks the establishment first; all writers use that lock, including reserve_session.
export async function reserve(
  tx: Prisma.TransactionClient,
  input: {
    consumerId: string;
    serviceId: string;
    professionalId: string;
    startsAt: Date;
    phone: string;
    key?: string;
    ignoreBookingId?: string;
    purpose?: string;
    seriesId?: string;
  },
) {
  const service = await tx.service.findUniqueOrThrow({
    where: { id: input.serviceId },
    include: { establishment: true },
  });
  const e = service.establishment;
  await tx.$queryRaw`SELECT id FROM establishments WHERE id=${e.id}::uuid FOR UPDATE`;
  if (e.ownerId === input.consumerId) throw Error("OWN_ESTABLISHMENT_BOOKING");
  const national = input.phone.replace(/^\+55\s*/, "");
  if (
    service.modality === "online" &&
    !whatsappSchema.safeParse(national).success
  )
    throw Error("WHATSAPP_REQUIRED");
  const available = await getAvailability(
    service.id,
    input.professionalId,
    dayKey(input.startsAt, e.timezone),
    tx,
    input.consumerId,
    input.ignoreBookingId,
  );
  const slot = available.slots.find(
    (s) => s.startsAt === input.startsAt.toISOString(),
  );
  if (!slot) throw Error("SESSION_UNAVAILABLE");
  let sessionId = slot.sessionId;
  if (!sessionId) {
    await tx.session.updateMany({
      where: {
        professionalId: input.professionalId,
        active: true,
        service: { kind: "individual" },
        bookings: {
          none: {
            OR: [
              { status: "confirmed" },
              { status: "pending", expiresAt: { gt: new Date() } },
            ],
          },
        },
      },
      data: { active: false },
    });
    const end = new Date(
      input.startsAt.getTime() + service.durationMinutes * 60000,
    );
    const session = await tx.session.create({
      data: {
        establishmentId: e.id,
        professionalId: input.professionalId,
        serviceId: service.id,
        startsAt: input.startsAt,
        endsAt: end,
        occupiedStart: new Date(
          input.startsAt.getTime() - service.bufferBefore * 60000,
        ),
        occupiedEnd: new Date(end.getTime() + service.bufferAfter * 60000),
        capacity: 1,
      },
    });
    sessionId = session.id;
  }
  const whatsapp = national ? `+55${national.replace(/\D/g, "")}` : null;
  const key = input.key ?? randomUUID();
  if (input.purpose || input.seriesId)
    await tx.$executeRaw`SELECT set_config('flow.silent_notifications','on',true)`;
  const rows = await tx.$queryRaw<
    { id: string }[]
  >`SELECT reserve_session(${sessionId}::uuid,${input.consumerId},${whatsapp}::text,${key}::uuid) AS id`;
  return tx.booking.update({
    where: { id: rows[0].id },
    data: {
      purpose: input.purpose ?? "normal",
      seriesId: input.seriesId ?? null,
    },
    include: { session: true },
  });
}

export async function notifyWorkflow(
  tx: Prisma.TransactionClient,
  accountId: string,
  key: string,
  title: string,
  body: string,
  href: string,
) {
  await tx.notification.upsert({
    where: { eventKey: key },
    create: { accountId, eventKey: key, title, body, href },
    update: {},
  });
}
export async function releaseBooking(
  tx: Prisma.TransactionClient,
  id: string,
  status = "canceled",
) {
  const before = await tx.booking.findUniqueOrThrow({ where: { id } });
  const [setting] = await tx.$queryRaw<
    { value: string | null }[]
  >`SELECT current_setting('flow.silent_notifications',true) AS value`;
  if (before.purpose !== "normal")
    await tx.$executeRaw`SELECT set_config('flow.silent_notifications','on',true)`;
  const b = await tx.booking.update({
    where: { id },
    data: { status },
    include: { session: { include: { service: true } } },
  });
  if (
    b.session.service.kind === "individual" &&
    !(await tx.booking.count({
      where: {
        sessionId: b.sessionId,
        OR: [
          { status: "confirmed" },
          { status: "pending", expiresAt: { gt: new Date() } },
        ],
      },
    }))
  )
    await tx.session.update({
      where: { id: b.sessionId },
      data: { active: false },
    });
  const requests = await tx.rescheduleRequest.findMany({
    where: {
      status: "pending",
      OR: [{ bookingId: id }, { targetBookingId: id }],
    },
  });
  for (const r of requests) {
    await tx.rescheduleRequest.update({
      where: { id: r.id },
      data: { status: "canceled" },
    });
    if (
      r.bookingId === id &&
      (await tx.booking.findUniqueOrThrow({ where: { id: r.targetBookingId } }))
        .status === "pending"
    )
      await releaseBooking(tx, r.targetBookingId);
    if (r.targetBookingId === id)
      await notifyWorkflow(
        tx,
        b.consumerId,
        `reschedule-canceled:${r.id}`,
        "Solicitação de mudança encerrada",
        "Confira seu agendamento original na sua agenda.",
        "/agendamentos",
      );
  }
  await tx.waitlistEntry.updateMany({
    where: { serviceId: b.session.serviceId, status: "waiting" },
    data: { searchFromDate: null, checkedAt: null },
  });
  if (before.purpose !== "normal")
    await tx.$executeRaw`SELECT set_config('flow.silent_notifications',${setting.value ?? ""},true)`;
  return b;
}
export async function localInstant(
  tx: Prisma.TransactionClient,
  date: string,
  time: string,
  timezone: string,
) {
  const rows = await tx.$queryRaw<
    { at: Date }[]
  >`SELECT ((${date}::date + ${time}::time) AT TIME ZONE ${timezone}) AS at`;
  return rows[0].at;
}
