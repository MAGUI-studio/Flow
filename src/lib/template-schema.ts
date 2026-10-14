import { z } from "zod";
export const templateSchema = z.object({
  establishmentId: z.string().uuid(),
  templateId: z.enum(["flow", "minimal", "editorial", "night"]),
});
