import { test } from "node:test";
import assert from "node:assert/strict";
import { websiteSchema, instagramSchema } from "../src/lib/business-contacts";
test("business contacts accept normalized sites and Instagram profiles while rejecting unsafe links", () => {
  assert.equal(
    websiteSchema.parse("meuespaco.com.br"),
    "https://meuespaco.com.br",
  );
  assert.equal(instagramSchema.parse("@meu.espaco"), "meu.espaco");
  assert.equal(
    instagramSchema.parse("https://www.instagram.com/meu.espaco/"),
    "meu.espaco",
  );
  for (const link of [
    "javascript:alert(1)",
    "https://user:password@example.com",
    "data:text/html,<script>",
    "https://",
  ])
    assert.equal(websiteSchema.safeParse(link).success, false);
  assert.equal(
    instagramSchema.safeParse("https://evil.com/meu.espaco").success,
    false,
  );
});
