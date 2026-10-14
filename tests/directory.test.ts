import { test } from "node:test";
import assert from "node:assert/strict";
import { filterDirectory, directoryHref } from "../src/lib/directory-state";
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
