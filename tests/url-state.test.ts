import { test } from "node:test";
import assert from "node:assert/strict";
import {
  loadPanelSearch,
  loadConsumerSearch,
  panelHref,
  serializePanel,
} from "../src/lib/url-state";

test("workspace URLs preserve the selected business through list and create routes", () => {
  assert.equal(
    panelHref("/painel/servicos/novo", "business-1"),
    "/painel/servicos/novo?estabelecimento=business-1",
  );
  assert.equal(
    panelHref("/painel/estabelecimentos"),
    "/painel/estabelecimentos",
  );
});
test("server filters restore a shared URL and reject an unknown period", async () => {
  const query = await loadPanelSearch(
    Promise.resolve({
      estabelecimento: "business-1",
      busca: "Corte",
      profissional: "172c629d-78ed-480e-93ed-5d5d4fd89fc1",
      periodo: "past",
      status: "confirmed",
    }),
  );
  assert.equal(query.estabelecimento, "business-1");
  assert.equal(query.busca, "Corte");
  assert.equal(query.profissional, "172c629d-78ed-480e-93ed-5d5d4fd89fc1");
  assert.equal(query.periodo, "past");
  const invalid = await loadConsumerSearch(
    Promise.resolve({ periodo: "invalid" }),
  );
  assert.equal(invalid.periodo, "upcoming");
  assert.equal(invalid.busca, "");
});
test("default filters do not clutter URLs and search terms are encoded", () => {
  const url = serializePanel("/painel/agenda", {
    busca: "Yoga & movimento",
    status: "all",
    periodo: "upcoming",
  });
  assert.equal(url, "/painel/agenda?busca=Yoga+%26+movimento");
});

test("invalid professional IDs and booking statuses fall back safely before querying PostgreSQL", async () => {
  const query = await loadPanelSearch(
    Promise.resolve({ profissional: "not-a-uuid", status: "unknown" }),
  );
  assert.equal(query.profissional, "all");
  assert.equal(query.status, "all");
});
