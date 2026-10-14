import Stripe from "stripe";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
    return Response.json(
      { error: "Webhook não configurado." },
      { status: 503 },
    );
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
    ].includes(event.type)
  )
    return Response.json({ received: true });
  const incoming = event.data.object as Stripe.Subscription;
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      incoming.id,
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
    const subscription = await stripe.subscriptions.retrieve(incoming.id);
    const owner = subscription.metadata.flowUserId;
    const item = subscription.items.data[0];
    const plan =
      item?.price.id === process.env.STRIPE_PRICE_BASIC
        ? "basic"
        : item?.price.id === process.env.STRIPE_PRICE_MULTI
          ? "multi"
          : null;
    if (
      !owner ||
      !plan ||
      !(await client.query("SELECT 1 FROM accounts WHERE id=$1", [owner]))
        .rowCount
    )
      throw new Error("UNRECOGNIZED_SUBSCRIPTION");
    const current = await client.query(
      "SELECT stripe_subscription_id FROM subscriptions WHERE owner_id=$1 FOR UPDATE",
      [owner],
    );
    if (
      current.rows[0]?.stripe_subscription_id &&
      current.rows[0].stripe_subscription_id !== subscription.id
    )
      throw new Error("SUBSCRIPTION_CONFLICT");
    const customer =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const end = new Date(item.current_period_end * 1000);
    await client.query(
      `INSERT INTO subscriptions(owner_id,stripe_customer_id,stripe_subscription_id,plan,status,paid_until) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(owner_id) DO UPDATE SET stripe_customer_id=excluded.stripe_customer_id,stripe_subscription_id=excluded.stripe_subscription_id,plan=excluded.plan,status=excluded.status,paid_until=excluded.paid_until`,
      [owner, customer, subscription.id, plan, subscription.status, end],
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
