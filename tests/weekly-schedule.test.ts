import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyWeeklySchedule,
  weeklyScheduleSchema,
} from "../src/lib/weekly-schedule";
test("weekly schedule supports days off and split shifts", () => {
  const schedule = emptyWeeklySchedule();
  schedule.days[0].enabled = true;
  schedule.days[0].intervals = [
    { start: "09:00", end: "12:00" },
    { start: "13:00", end: "18:00" },
  ];
  assert.equal(weeklyScheduleSchema.safeParse(schedule).success, true);
  assert.equal(schedule.days[6].enabled, false);
});
test("weekly schedule rejects invalid, overlapping or missing working hours", () => {
  for (const intervals of [
    [],
    [{ start: "18:00", end: "09:00" }],
    [{ start: "24:00", end: "25:00" }],
    [
      { start: "09:00", end: "14:00" },
      { start: "13:00", end: "18:00" },
    ],
  ]) {
    const schedule = emptyWeeklySchedule();
    schedule.days[0] = { weekday: 1, enabled: true, intervals };
    assert.equal(weeklyScheduleSchema.safeParse(schedule).success, false);
  }
});
test("weekly schedule accepts adjacent shifts and an entirely closed week", () => {
  const schedule = emptyWeeklySchedule();
  assert.equal(weeklyScheduleSchema.safeParse(schedule).success, true);
  schedule.days[0].enabled = true;
  schedule.days[0].intervals = [
    { start: "09:00", end: "12:00" },
    { start: "12:00", end: "18:00" },
  ];
  assert.equal(weeklyScheduleSchema.safeParse(schedule).success, true);
  schedule.days[1].weekday = 1;
  assert.equal(weeklyScheduleSchema.safeParse(schedule).success, false);
});
