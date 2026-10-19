import { test } from "node:test";
import assert from "node:assert/strict";
import { professionalList } from "../src/lib/professional-list";
import { loadPanelSearch } from "../src/lib/url-state";
const rows = [
  { name: "Zélia", services: [1, 2] },
  { name: "Álvaro", services: [] },
  { name: "Bruna", services: [1] },
];
test("professional ordering handles Portuguese names, service counts and preserves source order", () => {
  assert.deepEqual(
    professionalList(rows, "name_asc", "all").map((p) => p.name),
    ["Álvaro", "Bruna", "Zélia"],
  );
  assert.deepEqual(
    professionalList(rows, "name_desc", "all").map((p) => p.name),
    ["Zélia", "Bruna", "Álvaro"],
  );
  assert.deepEqual(
    professionalList(rows, "services_desc", "all").map((p) => p.name),
    ["Zélia", "Bruna", "Álvaro"],
  );
  assert.deepEqual(
    professionalList(rows, "services_asc", "all").map((p) => p.name),
    ["Álvaro", "Bruna", "Zélia"],
  );
  assert.equal(rows[0].name, "Zélia");
});
test("service link filters combine with ordering and restore safely from URLs", async () => {
  assert.equal(professionalList(rows, "name_asc", "linked").length, 2);
  assert.equal(
    professionalList(rows, "name_asc", "unlinked")[0].name,
    "Álvaro",
  );
  const query = await loadPanelSearch({
    ordem: "services_desc",
    vinculos: "unlinked",
  });
  assert.equal(query.ordem, "services_desc");
  assert.equal(query.vinculos, "unlinked");
  const invalid = await loadPanelSearch({
    ordem: "invalid",
    vinculos: "invalid",
  });
  assert.equal(invalid.ordem, "name_asc");
  assert.equal(invalid.vinculos, "all");
});
