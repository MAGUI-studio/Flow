import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type Stripe from "stripe";
import type { PoolClient } from "pg";

export const billingPlanSchema = z.enum(["basic", "multi"]);
export const changeRequestSchema = z.object({
  plan: billingPlanSchema,
  token: z.string().max(4096).optional(),
});
const quoteSchema = z.object({
  nonce: z.string().uuid(),
  owner: z.string(),
  plan: billingPlanSchema,
  subscription: z.string(),
  item: z.string(),
  previousPrice: z.string(),
  price: z.string(),
  at: z.number().int(),
  trial: z.boolean(),
});
export type BillingQuote = z.infer<typeof quoteSchema>;
function signature(value: string) {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("BILLING_NOT_CONFIGURED");
  return createHmac("sha256", process.env.STRIPE_SECRET_KEY)
    .update(`flow-plan-change-v1:${value}`)
    .digest("hex");
}
export function signBillingQuote(quote: BillingQuote) {
  const body = Buffer.from(JSON.stringify(quote)).toString("base64url");
  return `${body}.${signature(body)}`;
}
export function verifyBillingQuote(
  token: string,
  owner: string,
  plan: string,
  now = Math.floor(Date.now() / 1000),
) {
  const [body, mac, extra] = token.split(".");
  if (
    !body ||
    !mac ||
    extra ||
    !/^[a-f0-9]{64}$/.test(mac) ||
    !timingSafeEqual(Buffer.from(mac), Buffer.from(signature(body)))
  )
    throw new Error("INVALID_INPUT");
  let quote: BillingQuote;
  try {
    quote = quoteSchema.parse(
      JSON.parse(Buffer.from(body, "base64url").toString()),
    );
  } catch {
    throw new Error("INVALID_INPUT");
  }
  if (
    quote.owner !== owner ||
    quote.plan !== plan ||
    quote.at > now + 5 ||
    now - quote.at > 900
  )
    throw new Error("BILLING_QUOTE_EXPIRED");
  return quote;
}
export async function checkBillingLimits(
  client: PoolClient,
  owner: string,
  plan: string,
) {
  if (plan !== "basic") return;
  const units = await client.query(
    "SELECT id FROM establishments WHERE owner_id=$1",
    [owner],
  );
  if ((units.rowCount ?? 0) > 1)
    throw new Error("DOWNGRADE_SELECTION_REQUIRED");
  const team = await client.query(
    "SELECT 1 FROM professionals p JOIN establishments e ON e.id=p.establishment_id WHERE e.owner_id=$1 AND p.deleted_at IS NULL GROUP BY e.id HAVING count(*) > 10",
    [owner],
  );
  if (team.rowCount) throw new Error("PROFESSIONAL_DOWNGRADE_REQUIRED");
}
export function stripeSubscriptionState(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  const plan =
    item?.price.id === process.env.STRIPE_PRICE_BASIC
      ? "basic"
      : item?.price.id === process.env.STRIPE_PRICE_MULTI
        ? "multi"
        : null;
  if (!plan || sub.items.data.length !== 1 || item.quantity !== 1)
    throw new Error("UNRECOGNIZED_SUBSCRIPTION");
  return {
    plan,
    status: sub.status === "trialing" ? "active" : sub.status,
    paidUntil: new Date(
      Math.min(
        sub.status === "trialing" && sub.trial_end
          ? sub.trial_end
          : item.current_period_end,
        sub.cancel_at ?? Infinity,
      ) * 1000,
    ),
    currentPeriodStart: new Date(item.current_period_start * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end || sub.cancel_at != null,
  };
}

export async function prepareBillingChange(
  client: PoolClient,
  stripe: Stripe,
  owner: string,
  plan: "basic" | "multi",
  token?: string,
) {
  // The same account lock is used by establishment and professional writes.
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
    `billing-owner-${owner}`,
  ]);
  await client.query("SELECT id FROM accounts WHERE id=$1 FOR UPDATE", [owner]);
  const local = await client.query(
    "SELECT stripe_subscription_id,stripe_customer_id FROM subscriptions WHERE owner_id=$1 AND provider='stripe'",
    [owner],
  );
  if (!local.rows[0]?.stripe_subscription_id)
    throw new Error("BILLING_SUBSCRIPTION_REQUIRED");
  const sub = await stripe.subscriptions.retrieve(
    local.rows[0].stripe_subscription_id,
  );
  if (
    !["active", "trialing"].includes(sub.status) ||
    sub.cancel_at_period_end ||
    sub.cancel_at != null ||
    sub.pending_update ||
    sub.schedule
  )
    throw new Error("BILLING_CHANGE_UNAVAILABLE");
  const customer =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  if (customer !== local.rows[0].stripe_customer_id)
    throw new Error("FORBIDDEN");
  const state = stripeSubscriptionState(sub);
  if (state.plan === plan) throw new Error("BILLING_PLAN_UNCHANGED");
  await checkBillingLimits(client, owner, plan);
  const price =
    plan === "basic"
      ? process.env.STRIPE_PRICE_BASIC
      : process.env.STRIPE_PRICE_MULTI;
  if (!price) throw new Error("BILLING_NOT_CONFIGURED");
  const item = sub.items.data[0];
  if (!token) {
    const at = Math.floor(Date.now() / 1000);
    const invoice =
      sub.status === "trialing"
        ? null
        : await stripe.invoices.createPreview({
            customer,
            subscription: sub.id,
            subscription_details: {
              items: [{ id: item.id, price, quantity: 1 }],
              proration_behavior: "always_invoice",
              proration_date: at,
            },
          });
    const quote: BillingQuote = {
      nonce: randomUUID(),
      owner,
      plan,
      subscription: sub.id,
      item: item.id,
      previousPrice: item.price.id,
      price,
      at,
      trial: sub.status === "trialing",
    };
    return {
      token: signBillingQuote(quote),
      amountDue: invoice?.amount_due ?? 0,
      credit: Math.max(0, -(invoice?.total ?? 0)),
      trialEnd: sub.status === "trialing" ? sub.trial_end : null,
      currency: "brl",
    };
  }
  const quote = verifyBillingQuote(token, owner, plan);
  if (
    quote.subscription !== sub.id ||
    quote.item !== item.id ||
    quote.previousPrice !== item.price.id ||
    quote.price !== price ||
    quote.trial !== (sub.status === "trialing")
  )
    throw new Error("BILLING_QUOTE_EXPIRED");
  const receipt = await client.query(
    "INSERT INTO stripe_events(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
    [`flow-change-${signature(token)}`],
  );
  if (!receipt.rowCount) throw new Error("BILLING_QUOTE_EXPIRED");
  await stripe.subscriptions.update(
    sub.id,
    {
      items: [{ id: item.id, price, quantity: 1 }],
      proration_behavior: quote.trial ? "none" : "always_invoice",
      ...(quote.trial ? {} : { proration_date: quote.at }),
      payment_behavior: "pending_if_incomplete",
      expand: ["latest_invoice"],
    },
    { idempotencyKey: `flow-change-${signature(token)}` },
  );
  // A retried Stripe request can return its original response; read current state.
  const updated = await stripe.subscriptions.retrieve(sub.id, {
    expand: ["latest_invoice"],
  });
  const next = stripeSubscriptionState(updated);
  await client.query(
    "UPDATE subscriptions SET plan=$2,status=$3,paid_until=$4,current_period_start=$5,cancel_at_period_end=$6 WHERE owner_id=$1 AND stripe_subscription_id=$7",
    [
      owner,
      next.plan,
      next.status,
      next.paidUntil,
      next.currentPeriodStart,
      next.cancelAtPeriodEnd,
      sub.id,
    ],
  );
  const invoice =
    typeof updated.latest_invoice === "object" ? updated.latest_invoice : null;
  if (updated.pending_update) {
    if (!invoice?.hosted_invoice_url)
      throw new Error("BILLING_PAYMENT_PENDING");
    return { url: invoice.hosted_invoice_url, pending: true };
  }
  return { changed: true };
}
