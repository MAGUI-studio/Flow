import { test } from "node:test";
import assert from "node:assert/strict";
import {
  signBillingQuote,
  verifyBillingQuote,
  type BillingQuote,
} from "../src/lib/billing-change";

test("plan change quotes cannot be edited, reused by another owner or applied after expiry", () => {
  const original = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = "unit_test_key";
  try {
    const quote: BillingQuote = {
      nonce: "03451030-e49f-4a5a-ab40-ea18253d1ff2",
      owner: "owner",
      plan: "multi",
      subscription: "sub_test",
      item: "si_test",
      previousPrice: "price_basic",
      price: "price_multi",
      at: 1000,
      trial: false,
    };
    const signed = signBillingQuote(quote);
    assert.deepEqual(verifyBillingQuote(signed, "owner", "multi", 1100), quote);
    assert.throws(() => verifyBillingQuote(signed, "other", "multi", 1100));
    assert.throws(() => verifyBillingQuote(signed, "owner", "basic", 1100));
    assert.throws(() => verifyBillingQuote(signed, "owner", "multi", 1901));
    const tampered =
      Buffer.from(JSON.stringify({ ...quote, at: 1800 })).toString(
        "base64url",
      ) +
      "." +
      signed.split(".")[1];
    assert.throws(() => verifyBillingQuote(tampered, "owner", "multi", 1900));
  } finally {
    if (original === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = original;
  }
});
