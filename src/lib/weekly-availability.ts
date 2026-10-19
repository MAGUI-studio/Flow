import type { Prisma } from "@/generated/prisma/client";
// Weekly rules are expanded at query time, so they never expire or require a job.
export async function availabilityWindows(
  tx: Prisma.TransactionClient,
  professionalId: string,
  from: string,
  to: string,
) {
  return tx.$queryRaw<
    { startsAt: Date; endsAt: Date }[]
  >`SELECT starts_at AS "startsAt", ends_at AS "endsAt" FROM professional_availability_windows(${professionalId}::uuid, ${from}::date, ${to}::date) ORDER BY starts_at`;
}
export async function isWithinAvailability(
  tx: Prisma.TransactionClient,
  professionalId: string,
  start: Date,
  end: Date,
) {
  const [result] = await tx.$queryRaw<
    { available: boolean }[]
  >`SELECT professional_is_available(${professionalId}::uuid, ${start}::timestamptz, ${end}::timestamptz) AS available`;
  return result.available;
}
