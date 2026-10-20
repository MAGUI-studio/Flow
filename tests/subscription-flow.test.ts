import { test } from "node:test";
import assert from "node:assert/strict";
import {
  subscriptionAuthRedirects,
  existingSubscriptionDestination,
  subscriptionPlanSchema,
} from "../src/lib/subscription-flow";

test("sign-in and sign-up both resume the exact selected subscription instead of returning to the landing page", () => {
  for (const plan of ["basic", "multi"] as const) {
    const urls = subscriptionAuthRedirects(plan);
    assert.equal(urls.forceRedirectUrl, `/assinatura/continuar?plano=${plan}`);
    assert.equal(urls.signUpForceRedirectUrl, urls.forceRedirectUrl);
  }
  assert.equal(subscriptionPlanSchema.safeParse(null).success, false);
  assert.equal(
    subscriptionPlanSchema.safeParse("https://other.example").success,
    false,
  );
});

test("an existing subscriber returns to their plan or a change confirmation without starting another checkout", () => {
  assert.equal(
    existingSubscriptionDestination("basic", "basic"),
    "/painel/assinatura",
  );
  assert.equal(
    existingSubscriptionDestination("multi", "multi"),
    "/painel/assinatura",
  );
  assert.equal(
    existingSubscriptionDestination("multi", "basic"),
    "/assinatura/alterar?plano=multi",
  );
  assert.equal(
    existingSubscriptionDestination("basic", "multi"),
    "/assinatura/alterar?plano=basic",
  );
});
