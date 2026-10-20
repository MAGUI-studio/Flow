import { currentUser, apiError } from "@/lib/access";
import { db } from "@/lib/db";
import { billingEnabled, stripeClient } from "@/lib/stripe";
import {
  changeRequestSchema,
  prepareBillingChange,
} from "@/lib/billing-change";

export async function POST(request: Request) {
  try {
    const owner = await currentUser();
    if (!billingEnabled()) throw new Error("BILLING_NOT_CONFIGURED");
    const input = changeRequestSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!input.success) throw new Error("INVALID_INPUT");
    const client = await db().connect();
    try {
      await client.query("BEGIN");
      const result = await prepareBillingChange(
        client,
        stripeClient(),
        owner,
        input.data.plan,
        input.data.token,
      );
      await client.query("COMMIT");
      return Response.json(result);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return apiError(error);
  }
}
