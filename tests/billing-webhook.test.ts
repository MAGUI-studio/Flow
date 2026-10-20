import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { POST } from "../src/app/api/billing/webhook/route";

test("billing webhook rejects unsigned and tampered payloads before processing", async () => {
  const previousKey = process.env.STRIPE_SECRET_KEY;
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secret = "whsec_unit_test_only";
  process.env.STRIPE_SECRET_KEY = "unit_test_key_no_network";
  process.env.STRIPE_WEBHOOK_SECRET = secret;
  try {
    const stripe = new Stripe("unit_test_key_no_network");
    const payload = JSON.stringify({
      id: "evt_unit_test",
      object: "event",
      type: "product.created",
      data: { object: { id: "prod_unit_test" } },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    const unsigned = await POST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: payload,
      }),
    );
    assert.equal(unsigned.status, 400);
    const tampered = await POST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: payload.replace("prod_unit_test", "prod_tampered"),
        headers: { "stripe-signature": signature },
      }),
    );
    assert.equal(tampered.status, 400);
    const signed = await POST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: payload,
        headers: { "stripe-signature": signature },
      }),
    );
    assert.equal(signed.status, 200);
    assert.deepEqual(await signed.json(), { received: true });
  } finally {
    if (previousKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previousKey;
    if (previousSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
  }
});
