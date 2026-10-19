import { z } from "zod";
const date = z.iso.date("Informe uma data válida.");
export const professionalStatusSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("active") }),
  z.object({ status: z.literal("inactive") }),
  z
    .object({ status: z.literal("vacation"), start: date, end: date })
    .refine((v) => v.end >= v.start, {
      path: ["end"],
      message: "O término deve ser igual ou posterior ao início.",
    }),
]);
export function professionalVacationOverlaps(
  start: Date,
  end: Date,
  vacationStart: Date | null,
  vacationEnd: Date | null,
) {
  return (
    !!vacationStart &&
    !!vacationEnd &&
    start < vacationEnd &&
    end > vacationStart
  );
}
