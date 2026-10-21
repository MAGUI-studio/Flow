import { randomUUID } from "node:crypto";
export function reportOperationError(
  error: unknown,
  operation = "api.request",
  log: (
    message: string,
    details: Record<string, unknown>,
  ) => void = console.error,
) {
  const reference = randomUUID();
  const e = error as {
    name?: string;
    code?: string;
    meta?: { modelName?: string };
    stack?: string;
  } | null;
  log("Unhandled API operation error", {
    reference,
    operation,
    name: e?.name,
    code: e?.code,
    model: e?.meta?.modelName,
    frames:
      typeof e?.stack === "string"
        ? e.stack
            .split("\n")
            .filter((line) => /^\s+at /.test(line))
            .slice(0, 4)
        : [],
  });
  return reference;
}
