import { z } from "zod";
const score = z
  .number({ error: "Selecione uma nota." })
  .min(0)
  .max(5)
  .multipleOf(0.5, "Use passos de meia estrela.");
export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  establishmentScore: score,
  serviceScore: score,
});
export function reviewEligible(
  status: string,
  startsAt: Date | string,
  now = new Date(),
) {
  return (
    status === "completed" && now.getTime() >= new Date(startsAt).getTime()
  );
}
export function combinedRating(
  scores: { establishmentScore: number; serviceScore: number }[],
) {
  return scores.length
    ? scores.reduce(
        (total, score) => total + score.establishmentScore + score.serviceScore,
        0,
      ) /
        (scores.length * 4)
    : null;
}
