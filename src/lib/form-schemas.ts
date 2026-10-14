import { z } from "zod";
const name = z
  .string()
  .trim()
  .min(1, "Informe o nome.")
  .max(150, "Use até 150 caracteres.");
export const phoneSchema = z
  .string()
  .refine(
    (v) =>
      /^\(?[1-9]\d/.test(v) && [10, 11].includes(v.replace(/\D/g, "").length),
    "Informe um telefone com DDD e 10 ou 11 dígitos.",
  );
const optionalPhone = z.union([z.literal(""), phoneSchema]);
const number = (min: number, max: number) =>
  z.coerce
    .number()
    .int("Use um número inteiro.")
    .min(min, `O mínimo é ${min}.`)
    .max(max, `O máximo é ${max}.`);
const date = z.string().refine((v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T12:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, "Informe uma data válida.");
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Escolha a hora e os minutos.");
const professionalId = z.string().uuid("Escolha um profissional.");
export const establishmentSchema = z.object({
  name,
  slug: z
    .string()
    .min(3, "Use pelo menos 3 caracteres.")
    .max(70)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use letras minúsculas, números e hífens.",
    )
    .refine(
      (v) =>
        ![
          "painel",
          "planos",
          "agendamentos",
          "entrar",
          "sign-in",
          "sign-up",
          "api",
          "admin",
        ].includes(v),
      "Este endereço está reservado.",
    ),
  category: z.enum(
    [
      "Beleza",
      "Barbearia",
      "Saúde",
      "Bem-estar",
      "Educação",
      "Consultoria",
      "Outros",
    ],
    { error: "Escolha uma categoria." },
  ),
  description: z.string().max(1000, "Use até 1.000 caracteres."),
  city: z.string().max(150),
  address: z.string().max(300),
  contactPhone: optionalPhone,
  approvalMode: z.enum(["automatic", "manual"]),
  cancelNoticeHours: number(0, 720),
});
export const professionalSchema = z.object({ name });
export const serviceSchema = z
  .object({
    name,
    kind: z.enum(["individual", "collective"]),
    modality: z.enum(["in_person", "online"]),
    durationMinutes: number(5, 1440),
    stepMinutes: number(5, 1440),
    bufferBefore: number(0, 240),
    bufferAfter: number(0, 240),
    price: z.string().default(""),
    free: z.boolean(),
    professionalIds: z
      .array(professionalId)
      .min(1, "Escolha pelo menos um profissional."),
  })
  .refine((v) => v.free || v.price.replace(/\D/g, "").length > 0, {
    path: ["price"],
    message: "Informe o valor ou marque o serviço como gratuito.",
  })
  .refine((v) => v.free || Number(v.price.replace(/\D/g, "")) <= 100000000, {
    path: ["price"],
    message: "O valor máximo é R$ 1.000.000,00.",
  });
export const catalogSearchSchema = z.object({
  query: z.string().max(150, "Busque com até 150 caracteres."),
  city: z.string().max(150, "Use até 150 caracteres para a cidade."),
  modality: z.enum(["all", "in_person", "online"]),
});
export const availabilitySchema = z
  .object({
    professionalId,
    date,
    start: time,
    end: time,
    mode: z.enum(["open", "block"]),
  })
  .refine((v) => v.end > v.start, {
    path: ["end"],
    message: "O término deve ser depois do início.",
  });
export const sessionSchema = z.object({
  serviceId: z.string().uuid("Escolha um serviço coletivo."),
  professionalId,
  date,
  start: time,
  capacity: number(1, 1000),
});
export const businessSchemas = {
  establishment: establishmentSchema,
  professional: professionalSchema,
  service: serviceSchema,
  availability: availabilitySchema,
  session: sessionSchema,
};
export function bookingSchema(online: boolean) {
  return z.object({
    serviceId: z.string().uuid("Escolha um serviço."),
    professionalId,
    date,
    startsAt: z.string().datetime({ offset: true }),
    phone: online ? phoneSchema : optionalPhone,
  });
}
