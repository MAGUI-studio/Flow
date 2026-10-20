import { test } from "node:test";
import assert from "node:assert/strict";
import {
  reviewSchema,
  reviewEligible,
  combinedRating,
} from "../src/lib/review-rules";
const start = new Date("2026-10-10T15:00:00Z");
const boundary = new Date("2026-10-11T15:00:00Z");
test("reviews open immediately on completion, never for future or merely confirmed appointments", () => {
  assert.equal(
    reviewEligible("confirmed", start, new Date(boundary.getTime() - 1)),
    false,
  );
  assert.equal(reviewEligible("confirmed", start, boundary), false);
  assert.equal(reviewEligible("completed", start, start), true);
  assert.equal(
    reviewEligible("completed", start, new Date(start.getTime() - 1)),
    false,
  );
  assert.equal(reviewEligible("completed", start, boundary), true);
  for (const status of [
    "confirmed",
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
    serviceScore: 4.5,
  };
  assert.equal(reviewSchema.safeParse(input).success, true);
  for (const value of [-0.5, 5.5, 4.2, NaN, Infinity, "5", null, undefined])
    assert.equal(
      reviewSchema.safeParse({ ...input, establishmentScore: value }).success,
      false,
    );
  assert.equal(
    reviewSchema.safeParse({ ...input, serviceScore: undefined }).success,
    false,
  );
});
test("public average weights establishment and service scores equally, including zero", () => {
  assert.equal(combinedRating([]), null);
  assert.equal(combinedRating([{ establishmentScore: 0, serviceScore: 0 }]), 0);
  assert.equal(
    combinedRating([{ establishmentScore: 9, serviceScore: 6 }]),
    3.75,
  );
  assert.equal(
    combinedRating([
      { establishmentScore: 10, serviceScore: 10 },
      { establishmentScore: 0, serviceScore: 0 },
    ]),
    2.5,
  );
});
