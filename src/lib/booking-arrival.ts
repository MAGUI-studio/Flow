import { arrivalAvailable } from "./arrival-rules";
import type { Prisma } from "@/generated/prisma/client";
export async function markBookingArrival(
  tx: Prisma.TransactionClient,
  actor: string,
  id: string,
  now = new Date(),
) {
  const booking = await tx.booking.findUniqueOrThrow({
    where: { id },
    include: { session: { include: { establishment: true } } },
  });
  const e = booking.session.establishment;
  const subscription = await tx.subscription.findUnique({
    where: { ownerId: e.ownerId },
  });
  if (
    e.ownerId !== actor ||
    !subscription ||
    subscription.status !== "active" ||
    subscription.paidUntil <= new Date()
  )
    throw new Error("FORBIDDEN");
  if (booking.status !== "confirmed" || !booking.session.active)
    throw new Error("BOOKING_CLOSED");
  if (!booking.arrivedAt && !arrivalAvailable(booking.session.startsAt, now))
    throw new Error("ARRIVAL_TOO_EARLY");
  const result = await tx.booking.updateMany({
    where: { id, arrivedAt: null, status: "confirmed" },
    data: { arrivedAt: new Date() },
  });
  if (result.count)
    await tx.auditEvent.create({
      data: {
        actorId: actor,
        establishmentId: e.id,
        bookingId: id,
        action: "booking.arrived",
      },
    });
}
