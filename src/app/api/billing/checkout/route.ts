import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import type { PoolClient } from "pg";
import { stripeClient, billingEnabled } from "@/lib/stripe";
import { appUrl } from "@/lib/app-url";
import { currentUser, apiError } from "@/lib/access";
import { db } from "@/lib/db";
import { checkBillingLimits } from "@/lib/billing-change";
export async function POST(request: Request) {
  let connection: PoolClient | undefined;
  try {
    const userId = await currentUser();
    if (!billingEnabled())
      return Response.json(
        { error: "A contratação ainda não está disponível." },
        { status: 503 },
      );
    const parsed = z
      .object({ plan: z.enum(["basic", "multi"]) })
      .safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new Error("INVALID_INPUT");
    const body = parsed.data;
    const prices: Record<string, string | undefined> = {
      basic: process.env.STRIPE_PRICE_BASIC,
      multi: process.env.STRIPE_PRICE_MULTI,
    };
    const price = prices[body.plan];
    if (!price)
      return Response.json(
        { error: "Plano ainda indisponível para contratação." },
        { status: 503 },
      );
    if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_APP_URL)
      return Response.json(
        { error: "Cobrança ainda não configurada." },
        { status: 503 },
      );
    await db().query(
      "INSERT INTO accounts(id) VALUES($1) ON CONFLICT DO NOTHING",
      [userId],
    );
    connection = await db().connect();
    await connection.query("BEGIN");
    await connection.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
      [`billing-owner-${userId}`],
    );
    await connection.query("SELECT id FROM accounts WHERE id=$1 FOR UPDATE", [
      userId,
    ]);
    const existing = await connection.query(
      "SELECT stripe_subscription_id, stripe_customer_id FROM subscriptions WHERE owner_id=$1",
      [userId],
    );
    const stripe = stripeClient();
    const previous = existing.rows[0];
    const remote = previous?.stripe_subscription_id
      ? await stripe.subscriptions.retrieve(previous.stripe_subscription_id)
      : null;
    if (remote && !["canceled", "incomplete_expired"].includes(remote.status))
      return Response.json(
        {
          error:
            "Sua conta já possui uma assinatura. Alterações serão feitas pela gestão de assinatura.",
        },
        { status: 409 },
      );
    // Reuse the customer across subsequent subscriptions.
    const customer =
      previous?.stripe_customer_id ??
      (
        await stripe.customers.create(
          { metadata: { flowUserId: userId } },
          { idempotencyKey: `flow-customer-${userId}` },
        )
      ).id;
    await connection.query(
      "INSERT INTO subscriptions(owner_id,stripe_customer_id,plan,status,paid_until) VALUES($1,$2,$3,'incomplete',now()) ON CONFLICT(owner_id) DO UPDATE SET stripe_customer_id=excluded.stripe_customer_id",
      [userId, customer, body.plan],
    );
    const history = await stripe.subscriptions.list({
      customer,
      status: "all",
      limit: 100,
    });
    if (
      history.data.some(
        (sub) => !["canceled", "incomplete_expired"].includes(sub.status),
      )
    ) {
      return Response.json(
        {
          error:
            "Sua conta já possui uma assinatura. Abra a gestão de pagamentos.",
        },
        { status: 409 },
      );
    }
    await checkBillingLimits(connection, userId, body.plan);
    // Reuse an open session to avoid multiple subscriptions from repeated clicks.
    const openSessions = await stripe.checkout.sessions.list({
      customer,
      status: "open",
      limit: 100,
    });
    const open = openSessions.data.find(
      (session) => session.metadata?.flowPlan === body.plan,
    );
    if (open?.url) {
      await connection.query("COMMIT");
      return Response.json({ url: open.url });
    }
    for (const session of openSessions.data) {
      if (session.metadata?.flowUserId === userId)
        await stripe.checkout.sessions.expire(session.id);
    }
    const attempt = randomUUID();
    const label = Array.from(randomBytes(8), (byte) =>
      String.fromCharCode(97 + (byte % 26)),
    ).join("");
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        locale: "pt-BR",
        customer,
        metadata: { flowUserId: userId, flowPlan: body.plan },
        integration_identifier: `flow-subscription-${label}`,
        line_items: [{ price, quantity: 1 }],
        client_reference_id: userId,
        subscription_data: {
          metadata: { flowUserId: userId },
          ...(history.data.length === 0 ? { trial_period_days: 7 } : {}),
        },
        success_url: `${appUrl}/assinatura/retorno`,
        cancel_url: `${appUrl}/#planos`,
      },
      {
        idempotencyKey: `flow-checkout-${userId}-${attempt}`,
      },
    );
    await connection.query("COMMIT");
    return Response.json({ url: session.url });
  } catch (error) {
    return apiError(error);
  } finally {
    if (connection) {
      try {
        await connection.query("ROLLBACK");
      } finally {
        connection.release();
      }
    }
  }
}
