import type { Prisma } from "@/generated/prisma/client";
import { reviewSchema, reviewEligible } from "./review-rules";
export async function createReview(
  tx: Prisma.TransactionClient,
  consumerId: string,
  input: unknown,
  now = new Date(),
) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) throw new Error("INVALID_INPUT");
  const data = parsed.data;
  await tx.$queryRaw`SELECT id FROM bookings WHERE id=${data.bookingId}::uuid FOR UPDATE`;
  const booking = await tx.booking.findUnique({
    where: { id: data.bookingId },
    include: { session: true, review: true },
  });
  if (!booking || booking.consumerId !== consumerId)
    throw new Error("FORBIDDEN");
  if (!reviewEligible(booking.status, booking.session.startsAt, now))
    throw new Error("REVIEW_NOT_ELIGIBLE");
  if (booking.review) throw new Error("REVIEW_EXISTS");
  return tx.review.create({
    data: {
      bookingId: data.bookingId,
      establishmentScore: Math.round(data.establishmentScore * 2),
      professionalScore: Math.round(data.professionalScore * 2),
    },
  });
}
