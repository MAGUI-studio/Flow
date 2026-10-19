import { test } from "node:test";
import assert from "node:assert/strict";
import {
  professionalStatusSchema,
  professionalVacationOverlaps,
} from "../src/lib/professional-status";
test("vacations require valid inclusive dates in chronological order", () => {
  assert.equal(
    professionalStatusSchema.safeParse({
      status: "vacation",
      start: "2027-02-30",
      end: "2027-03-03",
    }).success,
    false,
  );
  assert.equal(
    professionalStatusSchema.safeParse({
      status: "vacation",
      start: "2027-03-04",
      end: "2027-03-03",
    }).success,
    false,
  );
  assert.equal(
    professionalStatusSchema.safeParse({
      status: "vacation",
      start: "2027-03-03",
      end: "2027-03-03",
    }).success,
    true,
  );
  assert.equal(
    professionalStatusSchema.safeParse({ status: "inactive" }).success,
    true,
  );
});
test("vacations exclude overlapping time including buffers, with exact boundaries released", () => {
  const from = new Date("2027-03-03T03:00:00Z"),
    until = new Date("2027-03-06T03:00:00Z");
  assert.equal(
    professionalVacationOverlaps(
      new Date("2027-03-03T02:30:00Z"),
      new Date("2027-03-03T03:01:00Z"),
      from,
      until,
    ),
    true,
  );
  assert.equal(
    professionalVacationOverlaps(
      new Date("2027-03-03T02:30:00Z"),
      from,
      from,
      until,
    ),
    false,
  );
  assert.equal(
    professionalVacationOverlaps(
      until,
      new Date("2027-03-06T04:00:00Z"),
      from,
      until,
    ),
    false,
  );
  assert.equal(professionalVacationOverlaps(from, until, null, null), false);
});
