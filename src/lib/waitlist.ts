import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { waitlistSchema } from "./scheduling-schemas";
import { dayKey, hourLabel } from "./format";
import { getAvailability } from "./availability";
import { reserve, releaseBooking, notifyWorkflow } from "./reservations";

export async function joinWaitlist(
  tx: Prisma.TransactionClient,
  consumerId: string,
  raw: unknown,
) {
  const input = waitlistSchema.parse(raw);
  await tx.$queryRaw`SELECT id FROM accounts WHERE id=${consumerId} FOR UPDATE`;
  const s = await tx.service.findUniqueOrThrow({
    where: { id: input.serviceId },
    include: {
      establishment: {
        include: { owner: { include: { subscription: true } } },
      },
      professionals: { include: { professional: true } },
    },
  });
  const e = s.establishment;
  if (e.ownerId === consumerId) throw Error("OWN_ESTABLISHMENT_BOOKING");
  if (
    !s.active ||
    !e.active ||
    !e.published ||
    e.owner.subscription?.status !== "active" ||
    e.owner.subscription.paidUntil <= new Date()
  )
    throw Error("SERVICE_UNAVAILABLE");
  if (
    input.professionalId &&
    !s.professionals.some(
      (p) =>
        p.professionalId === input.professionalId &&
        p.professional.active &&
        !p.professional.deletedAt,
    )
  )
    throw Error("PROFESSIONAL_UNAVAILABLE");
  const today = dayKey(new Date(), e.timezone);
  if (
    input.fromDate < today ||
    input.toDate > dayKey(new Date(Date.now() + 90 * 86400000), e.timezone)
  )
    throw Error("INVALID_INPUT");
  if (
    await tx.waitlistEntry.count({
      where: {
        consumerId,
        serviceId: s.id,
        professionalId: input.professionalId || null,
        status: { in: ["waiting", "offered"] },
      },
    })
  )
    throw Error("WAITLIST_DUPLICATE");
  return tx.waitlistEntry.create({
    data: {
      ...input,
      consumerId,
      professionalId: input.professionalId || null,
    },
  });
}
export async function decideWaitlist(
  tx: Prisma.TransactionClient,
  actor: string,
  id: string,
  accept: boolean,
) {
  const first = await tx.waitlistEntry.findUniqueOrThrow({ where: { id } });
  const service = await tx.service.findUniqueOrThrow({
    where: { id: first.serviceId },
    include: { establishment: true },
  });
  await tx.$queryRaw`SELECT id FROM accounts WHERE id=${actor} FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM establishments WHERE id=${service.establishmentId}::uuid FOR UPDATE`;
  const entry = await tx.waitlistEntry.findUniqueOrThrow({ where: { id } });
  if (entry.consumerId !== actor) throw Error("FORBIDDEN");
  if (accept) {
    if (
      entry.status !== "offered" ||
      !entry.offeredBookingId ||
      !entry.offerExpiresAt ||
      entry.offerExpiresAt <= new Date()
    )
      throw Error("BOOKING_CLOSED");
    const b = await tx.booking.findUniqueOrThrow({
      where: { id: entry.offeredBookingId },
      include: { session: true },
    });
    if (b.status !== "pending" || b.session.startsAt <= new Date())
      throw Error("BOOKING_CLOSED");
    const overlap = await tx.booking.count({
      where: {
        id: { not: b.id },
        consumerId: actor,
        OR: [
          { status: "confirmed" },
          { status: "pending", expiresAt: { gt: new Date() } },
        ],
        session: {
          startsAt: { lt: b.session.endsAt },
          endsAt: { gt: b.session.startsAt },
        },
      },
    });
    if (overlap) throw Error("CONSUMER_CONFLICT");
    const manual = service.establishment.approvalMode === "manual";
    await tx.booking.update({
      where: { id: b.id },
      data: {
        purpose: "normal",
        status: manual ? "pending" : "confirmed",
        expiresAt: manual
          ? new Date(
              Math.min(Date.now() + 24 * 3600000, b.session.startsAt.getTime()),
            )
          : null,
      },
    });
    await tx.waitlistEntry.update({
      where: { id },
      data: { status: "booked" },
    });
    for (const account of [actor, service.establishment.ownerId])
      await notifyWorkflow(
        tx,
        account,
        `waitlist-accepted:${id}:${account}`,
        manual ? "Vaga aceita, aguardando aprovação" : "Vaga confirmada",
        `${service.name} · ${b.session.startsAt.toLocaleString("pt-BR", { timeZone: service.establishment.timezone })}`,
        account === actor
          ? "/agendamentos"
          : `/painel/agenda?estabelecimento=${service.establishmentId}`,
      );
    return b.id;
  }
  if (!["waiting", "offered"].includes(entry.status))
    throw Error("BOOKING_CLOSED");
  if (entry.offeredBookingId) {
    const b = await tx.booking.findUnique({
      where: { id: entry.offeredBookingId },
    });
    if (b?.status === "pending") await releaseBooking(tx, b.id);
  }
  await tx.waitlistEntry.update({
    where: { id },
    data: { status: "canceled" },
  });
}

// One bounded batch per run. Establishment and account locks also serialize public reservations.
export async function processScheduling(db: PrismaClient) {
  const deadline = Date.now() + 25000;
  const expired = await db.rescheduleRequest.findMany({
    where: { status: "pending", expiresAt: { lte: new Date() } },
    take: 25,
  });
  for (const r of expired)
    await db.$transaction(async (tx) => {
      const target = await tx.booking.findUniqueOrThrow({
        where: { id: r.targetBookingId },
        include: { session: true },
      });
      await tx.$queryRaw`SELECT id FROM establishments WHERE id=${target.session.establishmentId}::uuid FOR UPDATE`;
      const fresh = await tx.rescheduleRequest.findUniqueOrThrow({
        where: { id: r.id },
      });
      if (fresh.status !== "pending") return;
      await tx.rescheduleRequest.update({
        where: { id: r.id },
        data: { status: "expired" },
      });
      if (
        (await tx.booking.findUniqueOrThrow({ where: { id: target.id } }))
          .status === "pending"
      )
        await releaseBooking(tx, target.id, "expired");
      await notifyWorkflow(
        tx,
        target.consumerId,
        `reschedule-expired:${r.id}`,
        "Solicitação de reagendamento expirada",
        "Consulte sua agenda: o atendimento original foi mantido.",
        "/agendamentos",
      );
    });
  const entries = await db.waitlistEntry.findMany({
    where: { status: { in: ["waiting", "offered"] } },
    orderBy: [
      { checkedAt: { sort: "asc", nulls: "first" } },
      { createdAt: "asc" },
      { id: "asc" },
    ],
    take: 12,
  });
  for (const row of entries) {
    if (Date.now() > deadline) break;
    try {
      await db.$transaction(
        async (tx) => {
          const service = await tx.service.findUniqueOrThrow({
            where: { id: row.serviceId },
            include: {
              establishment: true,
              professionals: { include: { professional: true } },
            },
          });
          await tx.$queryRaw`SELECT id FROM accounts WHERE id=${row.consumerId} FOR UPDATE`;
          await tx.$queryRaw`SELECT id FROM establishments WHERE id=${service.establishmentId}::uuid FOR UPDATE`;
          let entry = await tx.waitlistEntry.findUniqueOrThrow({
            where: { id: row.id },
          });
          if (!["waiting", "offered"].includes(entry.status)) return;
          await tx.waitlistEntry.update({
            where: { id: entry.id },
            data: { checkedAt: new Date() },
          });
          const today = dayKey(new Date(), service.establishment.timezone);
          if (entry.status === "offered") {
            const b = entry.offeredBookingId
              ? await tx.booking.findUnique({
                  where: { id: entry.offeredBookingId },
                })
              : null;
            if (entry.offerExpiresAt! > new Date() && b?.status === "pending")
              return;
            if (b?.status === "pending")
              await releaseBooking(tx, b.id, "expired");
            entry = await tx.waitlistEntry.update({
              where: { id: entry.id },
              data: {
                status: "waiting",
                offeredBookingId: null,
                offerExpiresAt: null,
              },
            });
          }
          if (entry.toDate < today) {
            await tx.waitlistEntry.update({
              where: { id: entry.id },
              data: { status: "expired" },
            });
            return;
          }
          const professionals = service.professionals.filter(
            (p) =>
              p.professional.active &&
              !p.professional.deletedAt &&
              (!entry.professionalId ||
                entry.professionalId === p.professionalId),
          );
          const searchFrom = [
            entry.searchFromDate ?? entry.fromDate,
            today,
            entry.fromDate,
          ]
            .sort()
            .at(-1)!;
          const end = new Date(searchFrom + "T12:00:00Z");
          end.setUTCDate(end.getUTCDate() + 6);
          const searchTo = [
            end.toISOString().slice(0, 10),
            entry.toDate,
          ].sort()[0];
          for (const p of professionals) {
            const initial = await getAvailability(
              service.id,
              p.professionalId,
              undefined,
              tx,
              entry.consumerId,
            );
            for (const date of initial.dates.filter(
              (d) =>
                d >= searchFrom &&
                d <= searchTo &&
                entry.weekdays.includes(new Date(d + "T12:00:00Z").getUTCDay()),
            )) {
              const available = await getAvailability(
                service.id,
                p.professionalId,
                date,
                tx,
                entry.consumerId,
              );
              const slot = available.slots.find((s) => {
                const time = hourLabel(
                  s.startsAt,
                  service.establishment.timezone,
                );
                const end = hourLabel(
                  new Date(
                    new Date(s.startsAt).getTime() +
                      service.durationMinutes * 60000,
                  ),
                  service.establishment.timezone,
                );
                return (
                  time >= entry.fromTime &&
                  end <= entry.toTime &&
                  end > time &&
                  new Date(s.startsAt).getTime() > Date.now() + 30 * 60000 &&
                  !entry.attemptedSlots.includes(
                    `${p.professionalId}:${s.startsAt}`,
                  )
                );
              });
              if (!slot) continue;
              const b = await reserve(tx, {
                consumerId: entry.consumerId,
                serviceId: service.id,
                professionalId: p.professionalId,
                startsAt: new Date(slot.startsAt),
                phone: entry.phone,
                purpose: "waitlist",
              });
              const expiresAt = new Date(
                Math.min(Date.now() + 30 * 60000, b.session.startsAt.getTime()),
              );
              await tx.booking.update({
                where: { id: b.id },
                data: { status: "pending", expiresAt },
              });
              await tx.waitlistEntry.update({
                where: { id: entry.id },
                data: {
                  status: "offered",
                  offeredBookingId: b.id,
                  offerExpiresAt: expiresAt,
                  attemptedSlots: {
                    push: `${p.professionalId}:${slot.startsAt}`,
                  },
                },
              });
              await notifyWorkflow(
                tx,
                entry.consumerId,
                `waitlist-offer:${b.id}`,
                "Uma vaga está disponível para você",
                `${service.name} · ${date.split("-").reverse().join("/")} às ${hourLabel(slot.startsAt, service.establishment.timezone)}. Aceite em até 30 minutos.`,
                "/lista-de-espera",
              );
              return;
            }
          }
          const next = new Date(searchTo + "T12:00:00Z");
          next.setUTCDate(next.getUTCDate() + 1);
          await tx.waitlistEntry.update({
            where: { id: entry.id },
            data: {
              searchFromDate:
                searchTo >= entry.toDate
                  ? null
                  : next.toISOString().slice(0, 10),
            },
          });
        },
        { timeout: 25000 },
      );
    } catch (error) {
      // Frozen services and stale slots must not prevent later entries from being processed.
      console.error(
        "Falha ao processar entrada da lista de espera",
        row.id,
        error instanceof Error ? error.name : "UnknownError",
      );
    }
  }
}
