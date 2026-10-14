import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planFeatures,
  allowedTemplate,
  effectiveTemplate,
  templates,
} from "../src/lib/plan-features";
import {
  reportDays,
  csvDocument,
  summarizeReport,
  type ReportRow,
} from "../src/lib/report-utils";
test("Pro grants twenty professionals, reports, export and two exclusive templates", () => {
  assert.equal(planFeatures("basic").professionals, 10);
  assert.equal(planFeatures("multi").professionals, 20);
  assert.equal(planFeatures("multi").reports, true);
  assert.equal(planFeatures("basic").export, false);
  assert.equal(
    templates.filter((template) => allowedTemplate(template.id, "basic"))
      .length,
    2,
  );
  assert.equal(
    templates.filter((template) => allowedTemplate(template.id, "multi"))
      .length,
    4,
  );
  assert.equal(allowedTemplate("invalid", "multi"), false);
  assert.equal(effectiveTemplate("night", "basic"), "flow");
  assert.equal(effectiveTemplate("night", "multi"), "night");
});
test("reports include only completed services in completed value and count cancellations separately", () => {
  const base = {
    id: "test",
    priceCents: 5000,
    startsAt: new Date(),
    service: "Corte",
    professional: "Ana",
    establishment: "Espaço",
    timezone: "America/Sao_Paulo",
  };
  const rows: ReportRow[] = [
    { ...base, status: "completed" },
    { ...base, status: "confirmed" },
    { ...base, status: "canceled" },
    { ...base, status: "expired" },
    { ...base, status: "no_show" },
  ];
  const summary = summarizeReport(rows);
  assert.equal(summary.total, 5);
  assert.equal(summary.completedValue, 5000);
  assert.equal(summary.canceled, 2);
  assert.equal(summary.noShows, 1);
  assert.deepEqual(summary.services, [{ name: "Corte", count: 5 }]);
  assert.equal(summarizeReport([]).completedValue, 0);
});
test("CSV quotes separators and newlines, escapes formulas and uses UTF-8 BOM", () => {
  assert.equal(
    csvDocument([["=SUM(A1)", 'Nome; "Teste"', "Linha\nnova"]]),
    '\uFEFF"\'=SUM(A1)";"Nome; ""Teste""";"Linha\nnova"',
  );
  assert.equal(reportDays("90"), 90);
  assert.equal(reportDays("5000"), 30);
  assert.equal(reportDays(null), 30);
});
