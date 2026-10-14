import { test } from "node:test";
import assert from "node:assert/strict";
import {
  reviewSchema,
  reviewEligible,
  combinedRating,
} from "../src/lib/review-rules";
const start = new Date("2026-10-10T15:00:00Z");
const boundary = new Date("2026-10-11T15:00:00Z");
test("reviews open exactly 24 hours after the appointment and only for confirmed or completed bookings", () => {
  assert.equal(
    reviewEligible("confirmed", start, new Date(boundary.getTime() - 1)),
    false,
  );
  assert.equal(reviewEligible("confirmed", start, boundary), true);
  assert.equal(reviewEligible("completed", start, boundary), true);
  for (const status of [
    "pending",
    "canceled",
    "declined",
    "expired",
    "no_show",
  ])
    assert.equal(reviewEligible(status, start, boundary), false);
});
test("review schema accepts zero and half stars, rejects invalid fractions and requires both scores", () => {
  const input = {
    bookingId: "b105142e-7c4a-49de-a7fd-619ca79af4b3",
    establishmentScore: 0,
    professionalScore: 4.5,
  };
  assert.equal(reviewSchema.safeParse(input).success, true);
  for (const value of [-0.5, 5.5, 4.2, NaN, Infinity, "5", null, undefined])
    assert.equal(
      reviewSchema.safeParse({ ...input, establishmentScore: value }).success,
      false,
    );
  assert.equal(
    reviewSchema.safeParse({ ...input, professionalScore: undefined }).success,
    false,
  );
});
test("public average weights establishment and professional scores equally, including zero", () => {
  assert.equal(combinedRating([]), null);
  assert.equal(
    combinedRating([{ establishmentScore: 0, professionalScore: 0 }]),
    0,
  );
  assert.equal(
    combinedRating([{ establishmentScore: 9, professionalScore: 6 }]),
    3.75,
  );
  assert.equal(
    combinedRating([
      { establishmentScore: 10, professionalScore: 10 },
      { establishmentScore: 0, professionalScore: 0 },
    ]),
    2.5,
  );
});
