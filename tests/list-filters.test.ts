import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesLinks, matchesListSearch } from "../src/lib/list-filters";
import { loadPanelSearch, serializePanel } from "../src/lib/url-state";

test("relationship filters distinguish all selected links from any, in both directions", () => {
  const linked = ["service-x", "service-y"];
  assert.equal(matchesLinks(linked, [], "all"), true);
  assert.equal(matchesLinks(linked, ["service-x", "service-y"], "all"), true);
  assert.equal(matchesLinks(["service-x"], linked, "all"), false);
  assert.equal(matchesLinks(["service-x"], linked, "any"), true);
  assert.equal(matchesLinks([], linked, "any"), false);
  assert.equal(
    matchesLinks(
      ["professional-a"],
      ["professional-a", "professional-b"],
      "all",
    ),
    false,
  );
  assert.equal(
    matchesLinks(
      ["professional-a"],
      ["professional-a", "professional-b"],
      "any",
    ),
    true,
  );
  assert.equal(
    matchesLinks(linked, ["foreign-establishment-id"], "all"),
    false,
  );
});

test("search ignores accents and excess spaces while requiring every word", () => {
  assert.equal(matchesListSearch("João Pedro", "  joao   pedro "), true);
  assert.equal(
    matchesListSearch("Hidratação facial", "facial hidratacao"),
    true,
  );
  assert.equal(matchesListSearch("João Pedro", "joao maria"), false);
  assert.equal(matchesListSearch("Qualquer nome", "  "), true);
});

test("multi-selection and match modes round-trip in URLs and reject malformed input", async () => {
  const a = "172c629d-78ed-480e-93ed-5d5d4fd89fc1";
  const b = "172c629d-78ed-480e-93ed-5d5d4fd89fc2";
  const url = serializePanel("/painel/profissionais", {
    servicos: [a, b],
    combinarServicos: "any",
  });
  const query = await loadPanelSearch(
    new URL(url, "https://example.test").searchParams,
  );
  assert.deepEqual(query.servicos, [a, b]);
  assert.equal(query.combinarServicos, "any");
  const services = await loadPanelSearch({
    profissionais: `${a},${b}`,
    combinarProfissionais: "any",
  });
  assert.deepEqual(services.profissionais, [a, b]);
  assert.equal(services.combinarProfissionais, "any");
  const invalid = await loadPanelSearch({
    servicos: `bad,${a},${a}`,
    profissionais: "invalid",
    combinarServicos: "invalid",
  });
  assert.deepEqual(invalid.servicos, [a]);
  assert.deepEqual(invalid.profissionais, []);
  assert.equal(invalid.combinarServicos, "all");
  assert.equal(
    serializePanel("/painel/servicos", {
      profissionais: [],
      combinarProfissionais: "all",
    }),
    "/painel/servicos",
  );
});
