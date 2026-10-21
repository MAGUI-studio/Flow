import { z } from "zod";
import { whatsappSchema } from "./form-schemas";
const id = z.string().uuid("Selecione uma opção válida.");
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Informe uma data válida.");
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido.");
export const blockSchema = z
  .object({
    establishmentId: id,
    professionalIds: z.array(id).max(20),
    fromDate: date,
    toDate: date,
    allDay: z.boolean(),
    fromTime: time,
    toTime: time,
    reason: z.string().trim().min(1, "Informe o motivo.").max(200),
    cancelConflicts: z.boolean(),
    conflictIds: z.array(id).max(500).default([]),
  })
  .refine(
    (v) =>
      v.toDate >= v.fromDate &&
      (v.allDay || v.toDate > v.fromDate || v.toTime > v.fromTime),
    { message: "O término deve ser posterior ao início.", path: ["toDate"] },
  );
export const rescheduleSchema = z.object({
  professionalId: id,
  date,
  startsAt: z.string().datetime({ offset: true }),
});
export const noteSchema = z.object({
  establishmentId: id,
  consumerId: z.string().min(1),
  content: z.string().trim().min(1, "Escreva a observação.").max(5000),
});
export const waitlistSchema = z
  .object({
    serviceId: id,
    professionalId: z.union([id, z.literal("")]),
    fromDate: date,
    toDate: date,
    fromTime: time,
    toTime: time,
    weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Escolha ao menos um dia da semana."),
    phone: whatsappSchema,
  })
  .refine((v) => v.toDate >= v.fromDate && v.toTime > v.fromTime, {
    path: ["toDate"],
    message: "Confira o período e os horários desejados.",
  });
export const seriesSchema = z
  .object({
    establishmentId: id,
    consumerId: z.string().min(1, "Selecione um cliente."),
    serviceId: id,
    professionalId: id,
    fromDate: date,
    time,
    intervalWeeks: z.number().int().min(1).max(2),
    count: z.number().int().min(2).max(12),
    phone: whatsappSchema,
    excludedDates: z.array(date).max(12),
    untilDate: z.union([date, z.literal("")]).default(""),
  })
  .refine((v) => !v.untilDate || v.untilDate >= v.fromDate, {
    path: ["untilDate"],
    message:
      "A data final deve ser igual ou posterior ao primeiro atendimento.",
  });
