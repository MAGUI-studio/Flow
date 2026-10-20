import { currentUser, apiError } from "@/lib/access";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/app-url";
import { stripeClient } from "@/lib/stripe";

export async function POST() {
  try {
    const owner = await currentUser();
    const result = await db().query(
      "SELECT stripe_customer_id FROM subscriptions WHERE owner_id=$1 AND provider='stripe'",
      [owner],
    );
    const customer = result.rows[0]?.stripe_customer_id;
    if (!customer)
      return Response.json(
        { error: "Sua conta ainda não possui uma assinatura no Stripe." },
        { status: 409 },
      );
    const session = await stripeClient().billingPortal.sessions.create({
      customer,
      locale: "pt-BR",
      return_url: `${appUrl}/assinatura`,
      ...(process.env.STRIPE_PORTAL_CONFIGURATION
        ? { configuration: process.env.STRIPE_PORTAL_CONFIGURATION }
        : {}),
    });
    return Response.json({ url: session.url });
  } catch (error) {
    return apiError(error);
  }
}
