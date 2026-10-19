import { test } from "node:test";
import assert from "node:assert/strict";
import { professionalScheduleSchema } from "../src/lib/professional-schedule";

const period = {
  professionalId: "914fe13e-803c-4b8c-81d2-bb870d77710c",
  date: "2026-10-20",
  endDate: "2026-10-20",
  start: "09:00",
  end: "18:00",
  mode: "open",
};
test("schedule validates dates, times and chronological order", () => {
  assert.equal(professionalScheduleSchema.safeParse(period).success, true);
  for (const change of [
    { date: "2026-02-30" },
    { endDate: "2026-02-30" },
    { start: "24:00" },
    { end: "09:00" },
    { end: "08:59" },
    { endDate: "2026-10-19" },
    { professionalId: "other" },
    { mode: "other" },
  ]) assert.equal(professionalScheduleSchema.safeParse({ ...period, ...change }).success, false);
});
test("schedule supports overnight periods and blocks", () => {
  assert.equal(professionalScheduleSchema.safeParse({ ...period, start: "22:00", endDate: "2026-10-21", end: "02:00", mode: "block" }).success, true);
});
