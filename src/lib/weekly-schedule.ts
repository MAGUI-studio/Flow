import { z } from "zod";
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido.");
export const weeklyScheduleSchema = z
  .object({
    days: z
      .array(
        z.object({
          weekday: z.number().int().min(0).max(6),
          enabled: z.boolean(),
          intervals: z.array(z.object({ start: time, end: time })).max(6),
        }),
      )
      .length(7),
  })
  .superRefine(({ days }, ctx) => {
    if (new Set(days.map((d) => d.weekday)).size !== 7)
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message: "Informe os sete dias da semana.",
      });
    days.forEach((day, i) => {
      if (day.weekday !== [1, 2, 3, 4, 5, 6, 0][i])
        ctx.addIssue({
          code: "custom",
          path: ["days", i, "weekday"],
          message: "Confira a ordem dos dias da semana.",
        });
      if (!day.enabled) return;
      if (!day.intervals.length)
        ctx.addIssue({
          code: "custom",
          path: ["days", i, "intervals"],
          message: "Adicione um horário para este dia.",
        });
      day.intervals.forEach((range, j) => {
        if (range.end <= range.start)
          ctx.addIssue({
            code: "custom",
            path: ["days", i, "intervals", j, "end"],
            message: "O término deve ser depois do início.",
          });
        if (
          day.intervals.some(
            (other, k) =>
              k < j && range.start < other.end && range.end > other.start,
          )
        )
          ctx.addIssue({
            code: "custom",
            path: ["days", i, "intervals", j, "start"],
            message: "Os horários deste dia não podem se sobrepor.",
          });
      });
    });
  });
export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>;
export const weekdays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];
export function emptyWeeklySchedule(): WeeklySchedule {
  return {
    days: [1, 2, 3, 4, 5, 6, 0].map((weekday) => ({
      weekday,
      enabled: false,
      intervals: [{ start: "09:00", end: "18:00" }],
    })),
  };
}
