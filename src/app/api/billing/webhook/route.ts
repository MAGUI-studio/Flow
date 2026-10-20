import Stripe from "stripe";
import { db } from "@/lib/db";
import { stripeClient } from "@/lib/stripe";
import { stripeSubscriptionState } from "@/lib/billing-change";
export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
    return Response.json(
      { error: "Webhook não configurado." },
      { status: 503 },
    );
  const stripe = stripeClient();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return Response.json({ error: "Assinatura inválida." }, { status: 400 });
  }
  if (
    ![
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
      "charge.refunded",
      "charge.dispute.created",
      "radar.early_fraud_warning.created",
    ].includes(event.type)
  )
    return Response.json({ received: true });
  const object = event.data.object;
  if (
    [
      "charge.refunded",
      "charge.dispute.created",
      "radar.early_fraud_warning.created",
    ].includes(event.type)
  ) {
    const chargeRef =
      event.type === "charge.refunded"
        ? (object as Stripe.Charge).id
        : (object as Stripe.Dispute | Stripe.Radar.EarlyFraudWarning).charge;
    try {
      const charge = await stripe.charges.retrieve(
        typeof chargeRef === "string" ? chargeRef : chargeRef.id,
      );
      const customer =
        typeof charge.customer === "string"
          ? charge.customer
          : charge.customer?.id;
      const client = await db().connect();
      try {
        await client.query("BEGIN");
        const inserted = await client.query(
          "INSERT INTO stripe_events(id) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
          [event.id],
        );
        if (inserted.rowCount && customer) {
          await client.query(
            "INSERT INTO audit_events(actor_id,action) SELECT owner_id,$2 FROM subscriptions WHERE stripe_customer_id=$1",
            [customer, `stripe:${event.type}:${event.id}:${charge.id}`],
          );
          console.warn("Stripe: revisão financeira necessária", {
            eventId: event.id,
            type: event.type,
            chargeId: charge.id,
          });
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
      return Response.json({ received: true });
    } catch {
      return Response.json(
        { error: "Não foi possível registrar o evento financeiro." },
        { status: 500 },
      );
    }
  }
  const invoiceSubscription = event.type.startsWith("invoice.")
    ? (object as Stripe.Invoice).parent?.subscription_details?.subscription
    : null;
  const subscriptionId = event.type.startsWith("customer.subscription.")
    ? (object as Stripe.Subscription).id
    : typeof invoiceSubscription === "string"
      ? invoiceSubscription
      : invoiceSubscription?.id;
  if (!subscriptionId) return Response.json({ received: true });
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      subscriptionId,
    ]);
    if (
      (
        await client.query("SELECT 1 FROM stripe_events WHERE id=$1", [
          event.id,
        ])
      ).rowCount
    ) {
      await client.query("COMMIT");
      return Response.json({ received: true });
    }
    // Retrieve after locking: a delayed event cannot restore an outdated state.
    let subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customer =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const mapped = await client.query(
      "SELECT owner_id FROM subscriptions WHERE stripe_customer_id=$1",
      [customer],
    );
    // Metadata bootstraps ownership only for the first Checkout subscription.
    const owner = mapped.rows[0]?.owner_id ?? subscription.metadata.flowUserId;
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      `billing-owner-${owner}`,
    ]);
    await client.query("SELECT id FROM accounts WHERE id=$1 FOR UPDATE", [
      owner,
    ]);
    // A plan change may have completed while this event waited for the account lock.
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const item = subscription.items.data[0];
    const plan =
      item?.price.id === process.env.STRIPE_PRICE_BASIC
        ? "basic"
        : item?.price.id === process.env.STRIPE_PRICE_MULTI
          ? "multi"
          : null;
    if (
      !owner ||
      !(await client.query("SELECT 1 FROM accounts WHERE id=$1", [owner]))
        .rowCount
    ) {
      // The Stripe account can also contain subscriptions from other applications.
      await client.query("INSERT INTO stripe_events(id) VALUES($1)", [
        event.id,
      ]);
      await client.query("COMMIT");
      return Response.json({ received: true });
    }
    if (!plan || subscription.items.data.length !== 1 || item.quantity !== 1)
      throw new Error("UNRECOGNIZED_SUBSCRIPTION");
    const current = await client.query(
      "SELECT stripe_subscription_id, status FROM subscriptions WHERE owner_id=$1 FOR UPDATE",
      [owner],
    );
    if (
      current.rows[0]?.stripe_subscription_id &&
      current.rows[0].stripe_subscription_id !== subscription.id
    ) {
      const previous = await stripe.subscriptions.retrieve(
        current.rows[0].stripe_subscription_id,
      );
      if (
        !["canceled", "incomplete_expired"].includes(previous.status) ||
        subscription.created < previous.created
      ) {
        await client.query("INSERT INTO stripe_events(id) VALUES($1)", [
          event.id,
        ]);
        await client.query("COMMIT");
        return Response.json({ received: true });
      }
    }
    const state = stripeSubscriptionState(subscription);
    await client.query(
      `INSERT INTO subscriptions(owner_id,stripe_customer_id,stripe_subscription_id,plan,status,paid_until,current_period_start,cancel_at_period_end,provider) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'stripe') ON CONFLICT(owner_id) DO UPDATE SET stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,plan=excluded.plan,status=excluded.status,paid_until=excluded.paid_until,current_period_start=excluded.current_period_start,cancel_at_period_end=excluded.cancel_at_period_end,provider='stripe'`,
      [
        owner,
        customer,
        subscription.id,
        plan,
        state.status,
        state.paidUntil,
        state.currentPeriodStart,
        state.cancelAtPeriodEnd,
      ],
    );
    await client.query("INSERT INTO stripe_events(id) VALUES($1)", [event.id]);
    await client.query("COMMIT");
    return Response.json({ received: true });
  } catch {
    await client.query("ROLLBACK");
    return Response.json(
      { error: "Não foi possível processar o evento." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
