import { test } from "node:test";
import {developmentSubscriptionsEnabled} from '../src/lib/development-subscriptions';
import assert from "node:assert/strict";
import {
  overlaps,
  pendingExpiresAt,
  canCancel,
  availableSlots,
  capacityAvailable,
} from "../src/lib/rules";
const at = (h: number, m = 0) => new Date(Date.UTC(2026, 9, 14, h, m));
test('instant subscriptions can never be enabled in production',()=>{assert.equal(developmentSubscriptionsEnabled('production','true'),false);assert.equal(developmentSubscriptionsEnabled('development','false'),false);assert.equal(developmentSubscriptionsEnabled('development','true'),true)});
test("adjacent appointments do not overlap but partially overlapping intervals do", () => {
  assert.equal(
    overlaps({ start: at(9), end: at(10) }, { start: at(10), end: at(11) }),
    false,
  );
  assert.equal(
    overlaps(
      { start: at(9), end: at(10) },
      { start: at(9, 30), end: at(10, 30) },
    ),
    true,
  );
});
test("pending booking expires within 24h or when the appointment starts", () => {
  assert.equal(pendingExpiresAt(at(9), at(11)).getTime(), at(11).getTime());
  assert.equal(
    pendingExpiresAt(at(9), new Date(at(9).getTime() + 48 * 3600000)).getTime(),
    at(9).getTime() + 24 * 3600000,
  );
  assert.throws(() => pendingExpiresAt(at(10), at(9)));
});
test("service duration differs from start cadence", () => {
  const slots = availableSlots({ start: at(9), end: at(11) }, 45, 15, [
    { start: at(10), end: at(10, 30) },
  ]);
  assert.deepEqual(
    slots.map((d) => d.toISOString().slice(11, 16)),
    ["09:00", "09:15"],
  );
});
test("buffers block adjacent slots and fit inside availability", () => {
  const slots = availableSlots(
    { start: at(9), end: at(11) },
    30,
    15,
    [{ start: at(10), end: at(10, 30) }],
    15,
    15,
  );
  assert.deepEqual(
    slots.map((d) => d.toISOString().slice(11, 16)),
    ["09:15"],
  );
  assert.throws(() => availableSlots({ start: at(9), end: at(11) }, 30, 0, []));
});
test("pending consumes capacity while canceled and expired bookings do not", () => {
  assert.equal(
    capacityAvailable(2, ["pending", "confirmed", "canceled"]),
    false,
  );
  assert.equal(capacityAvailable(2, ["confirmed", "expired"]), true);
});
test("consumer cancellation respects exact threshold and rejects past appointments", () => {
  assert.equal(canCancel(at(9), at(11), 2), true);
  assert.equal(canCancel(at(9, 1), at(11), 2), false);
  assert.equal(canCancel(at(11), at(11), 0), false);
});
