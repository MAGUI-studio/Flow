import { z } from "zod";

export const subscriptionPlanSchema = z.enum(["basic", "multi"]);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export function subscriptionAuthRedirects(plan: SubscriptionPlan) {
  const selected = subscriptionPlanSchema.parse(plan);
  const destination = `/assinatura/continuar?plano=${selected}`;
  return { forceRedirectUrl: destination, signUpForceRedirectUrl: destination };
}

export function existingSubscriptionDestination(
  selected: SubscriptionPlan,
  current: string,
) {
  return current === selected
    ? "/painel/assinatura"
    : `/assinatura/alterar?plano=${selected}`;
}
