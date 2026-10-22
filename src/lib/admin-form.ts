import { z } from "zod";

export const adminActionSchema = z
  .object({
    action: z.enum(["ban", "unban", "hide", "publish"]),
    target: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[a-zA-Z0-9_-]+$/),
    reason: z
      .string()
      .trim()
      .min(10, "Explique o motivo em pelo menos 10 caracteres.")
      .max(500, "Use até 500 caracteres."),
    confirmed: z
      .boolean()
      .refine((value) => value, "Confirme a ação antes de continuar."),
  })
  .superRefine((input, ctx) => {
    if (
      (input.action === "hide" || input.action === "publish") &&
      !z.uuid().safeParse(input.target).success
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["target"],
        message: "Estabelecimento inválido.",
      });
    }
  });
export type AdminActionInput = z.infer<typeof adminActionSchema>;
