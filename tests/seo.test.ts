import { test } from "node:test";
import assert from "node:assert/strict";
import { pageMetadata, jsonLd } from "../src/lib/seo";
test("public pages have unique titles, canonical URLs and matching sharing metadata", () => {
  const meta = pageMetadata(
    "Espaço Aurora — São Paulo",
    "Agende seu cuidado.",
    "/espaco-aurora",
    false,
    "https://images.example/banner.webp",
  );
  assert.deepEqual(meta.title, {
    absolute: "Espaço Aurora — São Paulo | Flow",
  });
  assert.equal(meta.description, "Agende seu cuidado.");
  assert.ok(String(meta.alternates?.canonical).endsWith("/espaco-aurora"));
  assert.deepEqual(meta.robots, { index: true, follow: true });
  assert.equal(meta.openGraph?.title, "Espaço Aurora — São Paulo | Flow");
});
test("private pages cannot inherit a public canonical or allow indexing", () => {
  const meta = pageMetadata(
    "Meus favoritos",
    "Seus espaços salvos.",
    "/favoritos",
    true,
  );
  assert.deepEqual(meta.robots, { index: false, follow: false });
  assert.equal(meta.alternates?.canonical, null);
});
test("structured data safely escapes user content without breaking JSON", () => {
  const value = { name: "</script><script>alert(1)</script>" };
  assert.ok(!jsonLd(value).includes("<"));
  assert.deepEqual(JSON.parse(jsonLd(value)), value);
});
