import { config } from "dotenv";
import assert from "node:assert/strict";
import Stripe from "stripe";
config({ path: ".env.local", quiet: true });
async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  assert.match(key ?? "", /^(sk|rk)_test_/);
  const stripe = new Stripe(key!, { apiVersion: "2026-09-30.endive" });
  const portal = await stripe.billingPortal.configurations.retrieve(
    process.env.STRIPE_PORTAL_CONFIGURATION!,
  );
  assert.equal(portal.features.subscription_cancel.enabled, true);
  assert.equal(portal.features.subscription_cancel.mode, "at_period_end");
  assert.equal(portal.features.subscription_update.enabled, false);
  const customer = await stripe.customers.create({
    metadata: { flowVerification: "checkout-config" },
  });
  try {
    for (const [id, amount] of [
      [process.env.STRIPE_PRICE_BASIC!, 4990],
      [process.env.STRIPE_PRICE_MULTI!, 8990],
    ] as const) {
      const price = await stripe.prices.retrieve(id);
      assert.equal(price.currency, "brl");
      assert.equal(price.unit_amount, amount);
      assert.equal(price.recurring?.interval, "month");
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: "subscription",
        line_items: [{ price: id, quantity: 1 }],
        subscription_data: { trial_period_days: 7 },
        integration_identifier: "flow-verification-qmxrkltp",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/assinatura/retorno`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#planos`,
      });
      try {
        assert.equal(session.mode, "subscription");
        assert.ok(session.url?.startsWith("https://checkout.stripe.com/"));
      } finally {
        await stripe.checkout.sessions.expire(session.id);
      }
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      configuration: portal.id,
      return_url: process.env.NEXT_PUBLIC_APP_URL,
    });
    assert.ok(session.url.startsWith("https://billing.stripe.com/"));
    console.log(
      "Stripe validado: ambos os preços, Checkout aceitando trial de 7 dias e Customer Portal. Sessões de verificação expiradas; nenhuma cobrança criada.",
    );
  } finally {
    await stripe.customers.del(customer.id);
  }
}
main().catch(() => {
  console.error(
    "Falha na verificação de teste do Stripe. Consulte a configuração e os logs do Workbench.",
  );
  process.exitCode = 1;
});
