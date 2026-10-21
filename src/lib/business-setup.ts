import type { Prisma } from "@/generated/prisma/client";
import { weeklyScheduleSchema } from "./weekly-schedule";
import { addressSchema } from "./address";
export async function setupState(
  tx: Prisma.TransactionClient,
  id: string,
  ownerId: string,
) {
  const business = await tx.establishment.findFirst({
    where: { id, ownerId, active: true },
    include: {
      professionals: {
        where: { active: true, deletedAt: null },
        select: {
          id: true,
          weeklySchedule: true,
          windows: {
            where: { endsAt: { gt: new Date() } },
            select: { id: true },
            take: 1,
          },
        },
      },
      services: {
        where: { active: true },
        include: {
          professionals: { select: { professionalId: true } },
          sessions: {
            where: { active: true, startsAt: { gt: new Date() } },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });
  if (!business) throw Error("FORBIDDEN");
  const scheduled = new Set(
    business.professionals
      .filter((p) => {
        const s = weeklyScheduleSchema.safeParse(p.weeklySchedule);
        return (
          p.windows.length > 0 ||
          (s.success &&
            s.data.days.some((d) => d.enabled && d.intervals.length > 0))
        );
      })
      .map((p) => p.id),
  );
  const team = new Set(business.professionals.map((p) => p.id));
  const services = business.services.some((s) =>
    s.professionals.some((p) => team.has(p.professionalId)),
  );
  const availability = business.services.some(
    (s) =>
      s.professionals.some((p) => scheduled.has(p.professionalId)) &&
      (s.kind !== "collective" || s.sessions.length > 0),
  );
  const address =
    business.services.every((s) => s.modality === "online") ||
    addressSchema.safeParse(business.addressDetails).success;
  return {
    business,
    team: team.size > 0,
    services,
    availability,
    address,
    ready: team.size > 0 && services && availability && address,
  };
}
