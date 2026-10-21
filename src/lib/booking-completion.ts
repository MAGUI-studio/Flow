import { Prisma } from "@/generated/prisma/client";

export const automaticCompletionDelay = 24 * 60 * 60 * 1000;

export async function completeOverdueBookings(
  tx: Prisma.TransactionClient,
  now = new Date(),
  scope: { consumerId?: string; ownerId?: string; bookingId?: string } = {},
) {
  const cutoff = new Date(now.getTime() - automaticCompletionDelay);
  await tx.$executeRaw(Prisma.sql`
    WITH expired AS (
      SELECT b.id FROM bookings b
      JOIN sessions s ON s.id=b.session_id JOIN establishments e ON e.id=s.establishment_id
      WHERE b.status='pending' AND b.expires_at <= ${now}
        ${scope.consumerId ? Prisma.sql`AND b.consumer_id=${scope.consumerId}` : Prisma.empty}
        ${scope.ownerId ? Prisma.sql`AND e.owner_id=${scope.ownerId}` : Prisma.empty}
        ${scope.bookingId ? Prisma.sql`AND b.id=${scope.bookingId}::uuid` : Prisma.empty}
      LIMIT 500 FOR UPDATE OF b SKIP LOCKED
    ) UPDATE bookings b SET status='expired' FROM expired WHERE b.id=expired.id
  `);
  // One atomic statement: concurrent workers skip locked bookings and cannot duplicate audit events.
  const result = await tx.$queryRaw<{ completed: number }[]>(Prisma.sql`
    WITH due AS (
      SELECT b.id FROM bookings b
      JOIN sessions s ON s.id=b.session_id
      JOIN establishments e ON e.id=s.establishment_id
      WHERE b.status='confirmed' AND s.starts_at <= ${cutoff}
        ${scope.consumerId ? Prisma.sql`AND b.consumer_id=${scope.consumerId}` : Prisma.empty}
        ${scope.ownerId ? Prisma.sql`AND e.owner_id=${scope.ownerId}` : Prisma.empty}
        ${scope.bookingId ? Prisma.sql`AND b.id=${scope.bookingId}::uuid` : Prisma.empty}
      ORDER BY s.starts_at, b.id
      LIMIT 500 FOR UPDATE OF b SKIP LOCKED
    ), completed AS (
      UPDATE bookings b SET status='completed',completed_automatically=true FROM due
      WHERE b.id=due.id AND b.status='confirmed'
      RETURNING b.id, b.session_id
    ), audit AS (
      INSERT INTO audit_events (actor_id, establishment_id, booking_id, action)
      SELECT NULL, s.establishment_id, c.id, 'booking.auto_completed'
      FROM completed c JOIN sessions s ON s.id=c.session_id
      RETURNING id
    )
    SELECT COUNT(*)::int AS completed FROM audit
  `);
  return result[0]?.completed ?? 0;
}
