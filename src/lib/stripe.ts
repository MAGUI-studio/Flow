import Stripe from "stripe";

export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("BILLING_NOT_CONFIGURED");
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-09-30.endive",
    maxNetworkRetries: 2,
    timeout: 15000,
  });
}

export function billingEnabled() {
  return (
    process.env.FLOW_BILLING_ENABLED === "true" &&
    !!process.env.STRIPE_SECRET_KEY &&
    !!process.env.STRIPE_WEBHOOK_SECRET &&
    !!process.env.STRIPE_PRICE_BASIC &&
    !!process.env.STRIPE_PRICE_MULTI &&
    !!process.env.NEXT_PUBLIC_APP_URL
  );
}

export async function billingSummary(subscription: {
  provider?: string;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
}) {
  if (subscription.provider !== "stripe" || !subscription.stripeSubscriptionId)
    return null;
  try {
    const remote = await stripeClient().subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );
    const customer =
      typeof remote.customer === "string"
        ? remote.customer
        : remote.customer.id;
    if (
      subscription.stripeCustomerId &&
      customer !== subscription.stripeCustomerId
    )
      return null;
    return {
      trialEnd: remote.status === "trialing" ? remote.trial_end : null,
      cancelAtPeriodEnd:
        remote.cancel_at_period_end || remote.cancel_at != null,
      status: remote.status,
    };
  } catch {
    return null;
  }
}
