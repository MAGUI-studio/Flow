import { test } from "node:test";
import assert from "node:assert/strict";
import { reportOperationError } from "../src/lib/error-reporting";
test("support references correlate failures without logging submitted data", () => {
  const entries: Record<string, unknown>[] = [];
  const secret = "customer-private-form-value";
  const error = new Error(secret);
  const reference = reportOperationError(
    error,
    "business.create",
    (_message, data) => entries.push(data),
  );
  assert.match(reference, /^[0-9a-f-]{36}$/);
  assert.equal(entries[0].reference, reference);
  assert.equal(entries[0].operation, "business.create");
  assert.equal(JSON.stringify(entries).includes(secret), false);
  assert.notEqual(
    reportOperationError(null, undefined, () => {}),
    reference,
  );
});
