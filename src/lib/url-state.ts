import {
  createLoader,
  createSerializer,
  parseAsString,
  parseAsStringEnum,
  createParser,
} from "nuqs/server";
const bookingStatus = parseAsStringEnum([
  "all",
  "confirmed",
  "pending",
  "canceled",
  "completed",
  "expired",
  "declined",
  "no_show",
]).withDefault("all");
const professionalFilter = createParser({
  parse: (value: string) =>
    value === "all" ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
      ? value
      : null,
  serialize: (value: string) => value,
}).withDefault("all");
export const panelSearch = {
  estabelecimento: parseAsString,
  busca: parseAsString.withDefault(""),
  status: bookingStatus,
  profissional: professionalFilter,
  periodo: parseAsStringEnum(["upcoming", "past", "all"]).withDefault(
    "upcoming",
  ),
};
export const loadPanelSearch = createLoader(panelSearch);
export const serializePanel = createSerializer(panelSearch);
export function panelHref(path: string, establishmentId?: string | null) {
  return serializePanel(path, { estabelecimento: establishmentId ?? null });
}
export const consumerSearch = {
  busca: parseAsString.withDefault(""),
  status: bookingStatus,
  periodo: parseAsStringEnum(["upcoming", "past", "all"]).withDefault(
    "upcoming",
  ),
};
export const loadConsumerSearch = createLoader(consumerSearch);
export const serializeConsumer = createSerializer(consumerSearch);
export type SearchInput = Promise<
  Record<string, string | string[] | undefined>
>;
