import { test } from "node:test";
import assert from "node:assert/strict";
import { isEstablishmentOwner } from "../src/lib/booking-policy";

test("owners cannot book their establishments while other customers remain eligible", () => {
  assert.equal(isEstablishmentOwner("owner", "owner"), true);
  assert.equal(isEstablishmentOwner("customer", "owner"), false);
  assert.equal(isEstablishmentOwner(null, "owner"), false);
  assert.equal(isEstablishmentOwner(undefined, undefined), false);
});
