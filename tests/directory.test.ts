import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterDirectory,
  directoryHref,
  paginateDirectory,
  parseMapBounds,
  inMapBounds,
} from "../src/lib/directory-state";
test("map area rejects malformed bounds and includes edge coordinates", () => {
  for (const invalid of [
    "",
    "1,2,3",
    "NaN,0,1,2",
    "-91,0,1,2",
    "0,-181,1,2",
    "1,0,0,2",
    "0,2,1,0",
    ",0,1,2",
  ])
    assert.equal(parseMapBounds(invalid), null);
  const bounds = parseMapBounds("-24,-47,-23,-46")!;
  assert.equal(inMapBounds({ latitude: -24, longitude: -47 }, bounds), true);
  assert.equal(
    inMapBounds({ latitude: -23.55, longitude: -46.63 }, bounds),
    true,
  );
  assert.equal(
    inMapBounds({ latitude: -25, longitude: -46.63 }, bounds),
    false,
  );
  assert.equal(inMapBounds(undefined, bounds), false);
  assert.ok(
    directoryHref("/explorar", { area: "-24,-47,-23,-46", pagina: 2 }).includes(
      "area=",
    ),
  );
});
const rows = [
  {
    name: "Studio Aurora",
    tag: "Beleza",
    city: "São Paulo, SP",
    category: "Beleza",
    serviceNames: ["Corte e finalização"],
    modalities: ["in_person"],
  },
  {
    name: "Clínica Viva",
    tag: "Saúde",
    city: "São Paulo, SP",
    category: "Saúde",
    serviceNames: ["Avaliação"],
    modalities: ["in_person", "online"],
  },
  {
    name: "Conecta Idiomas",
    tag: "Educação",
    city: "Online",
    category: "Educação",
    serviceNames: ["Conversação"],
    modalities: ["online"],
  },
];
const defaults = {
  pagina: 1,
  busca: "",
  cidade: "",
  categoria: "Todos",
  modalidade: "all" as const,
};
test("directory matches service names and cities regardless of accents and case", () => {
  assert.deepEqual(
    filterDirectory(rows, {
      ...defaults,
      busca: "FINALIZACAO",
      cidade: "sao paulo",
    }).map((b) => b.name),
    ["Studio Aurora"],
  );
});

test("directory pagination shows eight results and clamps invalid pages", () => {
  const entries = Array.from({ length: 19 }, (_, index) => index);
  assert.deepEqual(paginateDirectory(entries, 1).rows, entries.slice(0, 8));
  assert.deepEqual(paginateDirectory(entries, 2).rows, entries.slice(8, 16));
  assert.deepEqual(paginateDirectory(entries, 99), {
    page: 3,
    totalPages: 3,
    rows: entries.slice(16),
  });
  assert.equal(paginateDirectory(entries, -2).page, 1);
  assert.deepEqual(paginateDirectory([], 2), {
    page: 1,
    totalPages: 1,
    rows: [],
  });
  assert.equal(
    directoryHref("/explorar", { ...defaults, pagina: 2 }),
    "/explorar?pagina=2",
  );
});
test("directory combines categories and modalities, including hybrid establishments", () => {
  assert.deepEqual(
    filterDirectory(rows, {
      ...defaults,
      categoria: "Saúde",
      modalidade: "online",
    }).map((b) => b.name),
    ["Clínica Viva"],
  );
  assert.equal(
    filterDirectory(rows, {
      ...defaults,
      categoria: "Beleza",
      modalidade: "online",
    }).length,
    0,
  );
  assert.equal(filterDirectory(rows, defaults).length, 3);
});
test("full directory links preserve the current landing filters", () => {
  assert.equal(
    directoryHref("/explorar", {
      ...defaults,
      busca: "corte",
      categoria: "Beleza",
    }),
    "/explorar?busca=corte&categoria=Beleza",
  );
  assert.equal(directoryHref("/explorar", defaults), "/explorar");
});
