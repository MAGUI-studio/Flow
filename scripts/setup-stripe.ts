import { config } from "dotenv";
import { readFileSync, writeFileSync } from "node:fs";
import Stripe from "stripe";

config({ path: ".env.local", quiet: true });
async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !/^(sk|rk)_test_/.test(key))
    throw new Error("Este script exige uma chave de teste em .env.local.");
  const stripe = new Stripe(key, { apiVersion: "2026-09-30.endive" });
  const values: Record<string, string> = {};
  for (const plan of [
    {
      id: "basic",
      name: "Flow Essencial",
      amount: 4990,
      env: "STRIPE_PRICE_BASIC",
    },
    { id: "multi", name: "Flow PRO", amount: 8990, env: "STRIPE_PRICE_MULTI" },
  ]) {
    const lookup = `flow_${plan.id}_brl_monthly_${plan.amount}`;
    const prices = await stripe.prices.list({
      lookup_keys: [lookup],
      active: true,
    });
    let price = prices.data[0];
    if (!price) {
      const product = await stripe.products.create(
        { name: plan.name, metadata: { flowPlan: plan.id } },
        { idempotencyKey: `flow-product-${plan.id}` },
      );
      price = await stripe.prices.create(
        {
          product: product.id,
          currency: "brl",
          unit_amount: plan.amount,
          recurring: { interval: "month" },
          lookup_key: lookup,
        },
        { idempotencyKey: lookup },
      );
    }
    if (
      price.unit_amount !== plan.amount ||
      price.currency !== "brl" ||
      price.recurring?.interval !== "month"
    )
      throw new Error("Preço incompatível no Stripe.");
    values[plan.env] = price.id;
    console.log(`${plan.name}: preço mensal de teste configurado.`);
  }
  const configs = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  });
  let portal = configs.data.find(
    (item) => item.metadata?.flow === "subscriptions-v1",
  );
  if (!portal)
    portal = await stripe.billingPortal.configurations.create(
      {
        business_profile: { headline: "Gerencie sua assinatura Flow" },
        metadata: { flow: "subscriptions-v1" },
        features: {
          customer_update: {
            enabled: true,
            allowed_updates: ["name", "email", "address", "tax_id"],
          },
          invoice_history: { enabled: true },
          payment_method_update: { enabled: true },
          subscription_cancel: { enabled: true, mode: "at_period_end" },
          // Tier changes require checking the application's team and unit limits.
          subscription_update: { enabled: false },
        },
      },
      { idempotencyKey: "flow-portal-subscriptions-v1" },
    );
  values.STRIPE_PORTAL_CONFIGURATION = portal.id;
  let env = readFileSync(".env.local", "utf8");
  for (const [name, value] of Object.entries(values)) {
    const pattern = new RegExp(`^${name}=.*$`, "m");
    env = pattern.test(env)
      ? env.replace(pattern, `${name}=${value}`)
      : `${env}\n${name}=${value}\n`;
  }
  writeFileSync(".env.local", env);
  console.log(
    "IDs de teste salvos em .env.local. Configure o webhook antes de habilitar a cobrança.",
  );
}
main().catch(() => {
  console.error(
    "Não foi possível configurar o Stripe. Confira a chave de teste e a conexão de rede.",
  );
  process.exitCode = 1;
});
