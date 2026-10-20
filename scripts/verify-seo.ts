import assert from "node:assert/strict";
const base = process.env.SEO_VERIFY_URL ?? "http://localhost:3000";
for (const [path, title] of [
  ["/", "Agende serviços e encontre profissionais | Flow"],
  ["/explorar", "Explore serviços e profissionais | Flow"],
  [
    "/flow-espaco-jardins-db27d46b",
    "Flow Espaço Jardins — São Paulo, SP | Flow",
  ],
]) {
  const response = await fetch(base + path, {
    headers: { "User-Agent": "Twitterbot" },
  });
  const html = await response.text();
  assert.equal(response.status, 200, path);
  assert.ok(html.includes(`<title>${title}</title>`), `Missing title: ${path}`);
  assert.match(html, /<meta name="description" content="[^"]+"/);
  assert.match(html, /<link rel="canonical" href="[^"]+"/);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
  assert.match(html, /<meta name="robots" content="index, follow"/);
  console.log(
    `SEO ${path}: title, description, canonical, Open Graph, Twitter and indexing OK`,
  );
}
const robots = await (await fetch(base + "/robots.txt")).text();
assert.match(robots, /Sitemap: .*\/sitemap.xml/);
console.log("robots.txt: sitemap declared");
const sitemap = await (await fetch(base + "/sitemap.xml")).text();
assert.ok(sitemap.includes("/flow-espaco-jardins-db27d46b"));
assert.ok(!sitemap.includes("/painel"));
assert.ok(!sitemap.includes("/favoritos"));
console.log(
  "sitemap.xml: public business URLs included; private URLs excluded",
);
const image = await fetch(base + "/opengraph-image");
assert.equal(image.status, 200);
assert.ok(image.headers.get("content-type")?.includes("image/png"));
console.log("Open Graph image: 200 image/png");
