import { z } from "zod";
import { availabilitySchema } from "./form-schemas";
export const professionalScheduleSchema = z
  .object({
    ...availabilitySchema.shape,
    endDate: z.iso.date("Informe uma data válida."),
  })
  .refine((v) => v.endDate + "T" + v.end > v.date + "T" + v.start, {
    path: ["end"],
    message: "O término deve ser depois do início.",
  });
