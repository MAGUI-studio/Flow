import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "dotenv";
import Stripe from "stripe";
const path = ".env.homolog";
const env = parse(readFileSync(path));
if (
  !env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ||
  env.NEXT_PUBLIC_APP_URL !== "https://flow.magui.studio"
)
  throw new Error("Exige Stripe de teste e o domínio de homologação.");
const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const url = `${env.NEXT_PUBLIC_APP_URL}/api/billing/webhook`;
const existing = (await stripe.webhookEndpoints.list({ limit: 100 })).data.find(
  (endpoint) => endpoint.url === url,
);
if (existing) {
  console.log(
    "Endpoint de homologação já existe. Segredo existente preservado; se ausente, recupere-o no Stripe.",
  );
} else {
  const endpoint = await stripe.webhookEndpoints.create({
    url,
    description: "Flow homologation — test subscriptions",
    api_version: "2026-09-30.endive",
    enabled_events: [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
      "charge.refunded",
      "charge.dispute.created",
      "radar.early_fraud_warning.created",
    ],
  });
  env.STRIPE_WEBHOOK_SECRET = endpoint.secret!;
  writeFileSync(
    path,
    "# Homologacao Vercel: flow.magui.studio. Nao versionar.\n" +
      Object.entries(env)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join("\n") +
      "\n",
  );
  console.log(
    "Endpoint Stripe de teste criado; segredo salvo apenas em .env.homolog.",
  );
}
