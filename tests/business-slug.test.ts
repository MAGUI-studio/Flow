import { test } from "node:test";
import assert from "node:assert/strict";
import { businessSlug, reservedSlugs } from "../src/lib/business-slug";
test("automatic page addresses normalize names and avoid reserved or too short slugs", () => {
  assert.equal(businessSlug("  Clínica Viva! "), "clinica-viva");
  assert.equal(businessSlug("João & Maria"), "joao-maria");
  assert.equal(businessSlug("A"), "a-espaco");
  assert.equal(businessSlug(""), "");
  assert.equal(businessSlug("Entrar"), "entrar-espaco");
  assert.equal(businessSlug("Assinatura"), "assinatura-espaco");
  assert.ok(!reservedSlugs.includes(businessSlug("Painel")));
  const long = businessSlug("a".repeat(69) + " bbbbb");
  assert.ok(long.length <= 70 && !long.endsWith("-"));
});
