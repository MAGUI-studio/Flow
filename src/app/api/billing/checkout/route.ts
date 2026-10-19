import Stripe from "stripe";
import { appUrl } from "@/lib/app-url";
import { currentUser, apiError } from "@/lib/access";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  try {
    const userId = await currentUser();
    if (process.env.FLOW_BILLING_ENABLED !== "true")
      return Response.json(
        { error: "A contratação ainda não está disponível." },
        { status: 503 },
      );
    const body = await request.json();
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
    const existing = await db().query(
      "SELECT stripe_subscription_id FROM subscriptions WHERE owner_id=$1",
      [userId],
    );
    if (existing.rows[0]?.stripe_subscription_id)
      return Response.json(
        {
          error:
            "Sua conta já possui uma assinatura. Alterações serão feitas pela gestão de assinatura.",
        },
        { status: 409 },
      );
    await db().query(
      "INSERT INTO accounts(id) VALUES($1) ON CONFLICT DO NOTHING",
      [userId],
    );
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        line_items: [{ price, quantity: 1 }],
        client_reference_id: userId,
        subscription_data: { metadata: { flowUserId: userId } },
        success_url: `${appUrl}/painel?checkout=success`,
        cancel_url: `${appUrl}/#planos`,
      },
      {
        idempotencyKey: `flow-checkout-${userId}-${body.plan}-${Math.floor(Date.now() / 300000)}`,
      },
    );
    return Response.json({ url: session.url });
  } catch (error) {
    return apiError(error);
  }
}
