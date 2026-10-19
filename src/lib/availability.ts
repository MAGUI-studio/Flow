import {
  availabilityWindows,
  isWithinAvailability,
} from "./weekly-availability";
import { prisma } from "./prisma";
import { availableSlots, overlaps } from "./rules";
import { dayKey } from "./format";
import type { Prisma } from "@/generated/prisma/client";
import { professionalVacationOverlaps } from "./professional-status";
export type Slot = { startsAt: string; sessionId?: string; remaining: number };
export async function getAvailability(
  serviceId: string,
  professionalId: string,
  date?: string,
  tx: Prisma.TransactionClient = prisma(),
  consumerId?: string,
): Promise<{ dates: string[]; slots: Slot[] }> {
  const availability = await professionalAvailability(
    serviceId,
    professionalId,
    date,
    tx,
  );
  if (!consumerId || !availability.slots.length) return availability;
  const now = new Date();
  const [service, bookings] = await Promise.all([
    tx.service.findUniqueOrThrow({
      where: { id: serviceId },
      select: { durationMinutes: true },
    }),
    tx.booking.findMany({
      where: {
        consumerId,
        session: { endsAt: { gt: now } },
        OR: [
          { status: "confirmed" },
          { status: "pending", expiresAt: { gt: now } },
        ],
      },
      select: { session: { select: { startsAt: true, endsAt: true } } },
    }),
  ]);
  return {
    ...availability,
    slots: availability.slots.filter((slot) => {
      const start = new Date(slot.startsAt);
      const end = new Date(start.getTime() + service.durationMinutes * 60000);
      return !bookings.some(({ session }) =>
        overlaps(
          { start, end },
          { start: session.startsAt, end: session.endsAt },
        ),
      );
    }),
  };
}
async function professionalAvailability(
  serviceId: string,
  professionalId: string,
  date?: string,
  tx: Prisma.TransactionClient = prisma(),
): Promise<{ dates: string[]; slots: Slot[] }> {
  const service = await tx.service.findFirst({
    where: {
      id: serviceId,
      active: true,
      professionals: {
        some: { professionalId, professional: { active: true } },
      },
    },
    include: {
      establishment: {
        include: { owner: { include: { subscription: true } } },
      },
    },
  });
  if (!service) throw new Error("SERVICE_UNAVAILABLE");
  const professional = await tx.professional.findUniqueOrThrow({
    where: { id: professionalId },
  });
  const e = service.establishment;
  if (
    !e.active ||
    e.owner.subscription?.status !== "active" ||
    e.owner.subscription.paidUntil <= new Date()
  )
    throw new Error("ESTABLISHMENT_FROZEN");
  const now = new Date();
  const horizon = new Date(now.getTime() + 90 * 86400000);
  const windows = await availabilityWindows(
    tx,
    professionalId,
    dayKey(now, e.timezone),
    dayKey(horizon, e.timezone),
  );
  let dates: string[] = [];
  if (service.kind === "collective") {
    const sessions = await tx.session.findMany({
      where: { professionalId, serviceId, active: true, startsAt: { gt: now } },
      include: {
        bookings: {
          where: {
            OR: [
              { status: "confirmed" },
              { status: "pending", expiresAt: { gt: now } },
            ],
          },
          select: { id: true },
        },
      },
      orderBy: { startsAt: "asc" },
    });
    const permitted = await Promise.all(
      sessions.map(async (session) => {
        const [within, blocked] = await Promise.all([
          isWithinAvailability(
            tx,
            professionalId,
            session.occupiedStart,
            session.occupiedEnd,
          ),
          tx.professionalBlock.findFirst({
            where: {
              professionalId,
              startsAt: { lt: session.occupiedEnd },
              endsAt: { gt: session.occupiedStart },
            },
            select: { id: true },
          }),
        ]);
        return within && !blocked;
      }),
    );
    const available = sessions.filter(
      (s, index) =>
        permitted[index] &&
        s.bookings.length < s.capacity &&
        !professionalVacationOverlaps(
          s.occupiedStart,
          s.occupiedEnd,
          professional.vacationStartsAt,
          professional.vacationEndsAt,
        ),
    );
    dates = [...new Set(available.map((s) => dayKey(s.startsAt, e.timezone)))];
    return {
      dates,
      slots: available
        .filter((s) => dayKey(s.startsAt, e.timezone) === date)
        .map((s) => ({
          startsAt: s.startsAt.toISOString(),
          sessionId: s.id,
          remaining: s.capacity - s.bookings.length,
        })),
    };
  }
  const daySet = new Set<string>();
  for (const w of windows) {
    const start = new Date(Math.max(w.startsAt.getTime(), now.getTime()));
    for (
      let cursor = start.getTime();
      cursor < w.endsAt.getTime();
      cursor += 86400000
    )
      daySet.add(dayKey(new Date(cursor), e.timezone));
    daySet.add(dayKey(new Date(w.endsAt.getTime() - 1), e.timezone));
  }
  dates = [...daySet].sort();
  if (professional.vacationStartsAt && professional.vacationEndsAt) {
    const firstDay = dayKey(professional.vacationStartsAt, e.timezone);
    const lastDay = dayKey(
      new Date(professional.vacationEndsAt.getTime() - 1),
      e.timezone,
    );
    dates = dates.filter((day) => day < firstDay || day > lastDay);
  }
  if (!date) return { dates, slots: [] };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("INVALID_INPUT");
  const boundary = (
    await tx.$queryRaw<
      { start: Date; end: Date }[]
    >`SELECT (${date}::date::timestamp AT TIME ZONE ${e.timezone}) AS start,((${date}::date+1)::timestamp AT TIME ZONE ${e.timezone}) AS end`
  )[0];
  const sessions = await tx.session.findMany({
    where: {
      professionalId,
      active: true,
      occupiedStart: { lt: boundary.end },
      occupiedEnd: { gt: boundary.start },
      OR: [
        { service: { kind: "collective" } },
        {
          bookings: {
            some: {
              OR: [
                { status: "confirmed" },
                { status: "pending", expiresAt: { gt: now } },
              ],
            },
          },
        },
      ],
    },
    select: { occupiedStart: true, occupiedEnd: true },
  });
  const blocks = await tx.professionalBlock.findMany({
    where: {
      professionalId,
      startsAt: { lt: boundary.end },
      endsAt: { gt: boundary.start },
    },
  });
  const busy = [
    ...(professional.vacationStartsAt && professional.vacationEndsAt
      ? [
          {
            start: professional.vacationStartsAt,
            end: professional.vacationEndsAt,
          },
        ]
      : []),
    ...sessions.map((s) => ({ start: s.occupiedStart, end: s.occupiedEnd })),
    ...blocks.map((b) => ({ start: b.startsAt, end: b.endsAt })),
  ];
  const slots = windows
    .flatMap((w) =>
      availableSlots(
        { start: w.startsAt, end: w.endsAt },
        service.durationMinutes,
        service.stepMinutes,
        busy,
        service.bufferBefore,
        service.bufferAfter,
      ),
    )
    .filter((s) => s > now && s >= boundary.start && s < boundary.end);
  return {
    dates,
    slots: [
      ...new Map(
        slots.map((s) => [
          s.toISOString(),
          { startsAt: s.toISOString(), remaining: 1 },
        ]),
      ).values(),
    ].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  };
}
