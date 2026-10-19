import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeAppUrl } from "../src/lib/app-url";
test("application base URLs preserve localhost ports and remove trailing slashes", () => {
  assert.equal(
    normalizeAppUrl("http://localhost:3000/"),
    "http://localhost:3000",
  );
  assert.equal(
    normalizeAppUrl("https://flow.example.com///"),
    "https://flow.example.com",
  );
  assert.throws(() => normalizeAppUrl("javascript:alert(1)"));
  assert.throws(() => normalizeAppUrl("https://example.com/?wrong=1"));
});
