import { test } from "node:test";
import assert from "node:assert/strict";
import { businessCategories } from "../src/lib/business-categories";
import { establishmentSchema } from "../src/lib/form-schemas";
test("all twelve distinct categories are accepted by establishment validation", () => {
  assert.equal(businessCategories.length, 12);
  assert.equal(new Set(businessCategories).size, 12);
  assert.ok(businessCategories.includes("Outro"));
  for (const category of businessCategories)
    assert.equal(
      establishmentSchema.shape.category.safeParse(category).success,
      true,
    );
  assert.equal(
    establishmentSchema.shape.category.safeParse("Outros").success,
    false,
  );
});
