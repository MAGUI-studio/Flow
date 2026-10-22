import { test } from "node:test";
import assert from "node:assert/strict";
import {
  installReactDevPerformanceFix,
  normalizeReactDevMeasure,
} from "../src/lib/react-dev-performance";

const detail = (state = "Errored") => ({
  devtools: {
    trackGroup: "Server Components ⚛",
    tooltipText: `Layout ${state}`,
  },
});

test("React RSC negative debug timestamps are normalized without mutating the source", () => {
  for (const state of ["Errored", "Aborted"]) {
    const original = { start: 5, end: -23583, detail: detail(state) };
    const fixed = normalizeReactDevMeasure(original);
    assert.deepEqual(fixed, { ...original, start: 5, end: 5 });
    assert.equal(original.end, -23583);
    assert.equal(
      normalizeReactDevMeasure({ start: -10, end: -5, detail: detail(state) })
        .start,
      0,
    );
  }
});

test("valid traces and unrelated measurements preserve their original values", () => {
  for (const options of [
    { start: 0, end: 10, detail: detail() },
    { start: 0, end: -10 },
    { start: 0, end: -10, detail: detail("Rendered") },
    {
      start: 0,
      end: -10,
      detail: {
        devtools: { trackGroup: "Application", tooltipText: "Layout Errored" },
      },
    },
  ]) {
    assert.equal(normalizeReactDevMeasure(options), options);
  }
});

test("performance workaround installs once in development, stays off in production and preserves thrown errors", () => {
  const calls: unknown[][] = [];
  const measure: Performance["measure"] = (...args) => {
    calls.push(args);
    return {} as PerformanceMeasure;
  };
  const target = { measure };
  assert.equal(installReactDevPerformanceFix(target, "production"), false);
  assert.equal(target.measure, measure);
  assert.equal(installReactDevPerformanceFix(target, "development"), true);
  const installed = target.measure;
  assert.equal(installReactDevPerformanceFix(target, "development"), false);
  assert.equal(target.measure, installed);
  target.measure("Layout", { start: 0, end: -10, detail: detail() });
  assert.equal((calls[0][1] as PerformanceMeasureOptions).end, 0);
  target.measure("ordinary", "start", "end");
  assert.deepEqual(calls[1], ["ordinary", "start", "end"]);
  const throwing = {
    measure: (() => {
      throw new Error("REAL_MEASUREMENT_ERROR");
    }) as Performance["measure"],
  };
  installReactDevPerformanceFix(throwing, "development");
  assert.throws(() => throwing.measure("ordinary"), /REAL_MEASUREMENT_ERROR/);
});
