import { z } from "zod";
const score = z
  .number({ error: "Selecione uma nota." })
  .min(0)
  .max(5)
  .multipleOf(0.5, "Use passos de meia estrela.");
export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  establishmentScore: score,
  professionalScore: score,
});
export function reviewEligible(
  status: string,
  startsAt: Date | string,
  now = new Date(),
) {
  return (
    ["confirmed", "completed"].includes(status) &&
    now.getTime() >= new Date(startsAt).getTime() + 24 * 3600000
  );
}
export function combinedRating(
  scores: { establishmentScore: number; professionalScore: number }[],
) {
  return scores.length
    ? scores.reduce(
        (total, score) =>
          total + score.establishmentScore + score.professionalScore,
        0,
      ) /
        (scores.length * 4)
    : null;
}
