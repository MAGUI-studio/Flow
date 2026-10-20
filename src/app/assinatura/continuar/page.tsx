import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Continuar assinatura",
  "Continue a contratação do plano escolhido para o seu negócio.",
  "/assinatura/continuar",
  true,
);
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createLoader, parseAsStringEnum } from "nuqs/server";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { CheckoutContinuation } from "@/components/checkout-continuation";
import { developmentSubscriptionsEnabled } from "@/lib/development-subscriptions";
import {
  existingSubscriptionDestination,
  subscriptionPlanSchema,
} from "@/lib/subscription-flow";

const load = createLoader({ plano: parseAsStringEnum(["basic", "multi"]) });

export default async function ContinueSubscription({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth.protect();
  const query = await load(searchParams);
  const parsed = subscriptionPlanSchema.safeParse(query.plano);
  if (!parsed.success) redirect("/#planos");
  const development = developmentSubscriptionsEnabled(
    process.env.NODE_ENV,
    process.env.DEV_SUBSCRIPTIONS_ENABLED,
  );
  const subscription = await prisma().subscription.findUnique({
    where: { ownerId: userId },
  });
  if (
    !development &&
    subscription?.provider === "stripe" &&
    subscription.status === "active" &&
    subscription.paidUntil > new Date()
  ) {
    redirect(existingSubscriptionDestination(parsed.data, subscription.plan));
  }
  return (
    <Container as="main" className="py-20 sm:py-28">
      <CheckoutContinuation
        key={parsed.data}
        plan={parsed.data}
        development={development}
      />
    </Container>
  );
}
