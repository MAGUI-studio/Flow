import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { Client } from "pg";
import Stripe from "stripe";
import assert from "node:assert/strict";
const env = parse(readFileSync(".env.homolog"));
const base = "http://localhost:3001";
const db = new Client({ connectionString: env.DATABASE_URL });
try {
  await db.connect();
  const rows = (
    await db.query(
      "SELECT (SELECT count(*)::int FROM establishments) AS establishments,(SELECT count(*)::int FROM professionals) AS professionals,(SELECT count(*)::int FROM services) AS services",
    )
  ).rows[0];
  assert.equal(rows.establishments, 12);
  console.log("Neon pooled connection:", JSON.stringify(rows));
  for (const path of [
    "/",
    "/explorar",
    "/entrar",
    "/flow-espaco-jardins-db27d46b",
  ]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    console.log(`HTTP ${path}: 200`);
  }
  const link = (
    await db.query(
      "SELECT service_id,professional_id FROM professional_services LIMIT 1",
    )
  ).rows[0];
  const availability = await fetch(
    `${base}/api/availability?serviceId=${link.service_id}&professionalId=${link.professional_id}`,
  );
  assert.equal(availability.status, 200);
  assert.ok(Array.isArray((await availability.json()).dates));
  console.log("Availability API backed by Neon: 200");
  const unauthorized = await fetch(base + "/api/cron/complete-bookings");
  assert.equal(unauthorized.status, 401);
  const cron = await fetch(base + "/api/cron/complete-bookings", {
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });
  assert.equal(cron.status, 200);
  console.log("Cron authentication: 401 without secret / 200 with secret");
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const payload = JSON.stringify({
    id: "evt_flow_homolog_smoke",
    object: "event",
    type: "ping",
    data: { object: {} },
    livemode: false,
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: env.STRIPE_WEBHOOK_SECRET,
  });
  const webhook = await fetch(base + "/api/billing/webhook", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body: payload,
  });
  assert.equal(webhook.status, 200);
  const invalid = await fetch(base + "/api/billing/webhook", {
    method: "POST",
    body: payload,
  });
  assert.equal(invalid.status, 400);
  console.log(
    "Stripe webhook signature: 200 valid / 400 invalid (no payment created)",
  );
  const prices = await Promise.all(
    [env.STRIPE_PRICE_BASIC, env.STRIPE_PRICE_MULTI].map((id) =>
      stripe.prices.retrieve(id),
    ),
  );
  assert.deepEqual(
    prices.map((p) => p.unit_amount),
    [4990, 8990],
  );
  assert.ok(prices.every((p) => !p.livemode));
  console.log("Stripe test prices: BRL 49.90 / BRL 89.90 verified");
  console.log("Homologation smoke checks passed.");
} finally {
  await db.end();
}
