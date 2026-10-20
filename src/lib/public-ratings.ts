import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
export async function publicRatings(
  establishmentIds: string[],
  tx: Prisma.TransactionClient = prisma(),
) {
  if (!establishmentIds.length)
    return new Map<string, { rating: number; ratingCount: number }>();
  const rows = await tx.$queryRaw<
    { id: string; rating: number; ratingCount: number }[]
  >(Prisma.sql`
    SELECT s.establishment_id AS id, AVG((r.establishment_score+r.professional_score)/4.0)::float8 AS rating, COUNT(*)::int AS "ratingCount"
    FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN sessions s ON s.id=b.session_id
    JOIN establishments e ON e.id=s.establishment_id
    WHERE b.status='completed'
      AND LEFT(b.consumer_id,10) <> 'flow_seed_'
      AND b.consumer_id <> e.owner_id
      AND s.starts_at <= NOW()
      AND s.establishment_id IN (${Prisma.join(establishmentIds.map((id) => Prisma.sql`${id}::uuid`))})
    GROUP BY s.establishment_id
  `);
  return new Map(
    rows.map((row) => [
      row.id,
      { rating: row.rating, ratingCount: row.ratingCount },
    ]),
  );
}
