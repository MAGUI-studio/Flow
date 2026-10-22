const patchMarker = Symbol.for("flow.react-dev-performance");

/** Temporary workaround for React RSC errored/aborted debug timings in Next 16.4.
 * https://github.com/vercel/next.js/issues/99032
 * Preserve other measurements and errors; never install outside development.
 */
export function normalizeReactDevMeasure(options: PerformanceMeasureOptions) {
  const detail = options.detail as
    { devtools?: { trackGroup?: string; tooltipText?: string } } | undefined;
  if (
    detail?.devtools?.trackGroup !== "Server Components ⚛" ||
    !/ (Errored|Aborted)$/.test(detail.devtools.tooltipText ?? "")
  )
    return options;
  const negativeStart = typeof options.start === "number" && options.start < 0;
  const negativeEnd = typeof options.end === "number" && options.end < 0;
  if (!negativeStart && !negativeEnd) return options;
  const start = negativeStart ? 0 : options.start;
  return {
    ...options,
    start,
    end: negativeEnd
      ? typeof start === "number"
        ? Math.max(0, start)
        : 0
      : options.end,
  };
}

export function installReactDevPerformanceFix(
  target: Pick<Performance, "measure">,
  environment: string | undefined,
) {
  if (environment !== "development") return false;
  const original = target.measure;
  if ((original as unknown as Record<symbol, unknown>)[patchMarker])
    return false;
  const patched: Performance["measure"] = function (
    name,
    startOrOptions,
    endMark,
  ) {
    return original.call(
      target,
      name,
      startOrOptions && typeof startOrOptions === "object"
        ? normalizeReactDevMeasure(startOrOptions)
        : startOrOptions,
      endMark,
    );
  };
  Object.defineProperty(patched, patchMarker, { value: true });
  target.measure = patched;
  return true;
}
