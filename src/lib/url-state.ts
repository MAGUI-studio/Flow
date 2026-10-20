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
const linkedIds = createParser<string[]>({
  parse: (value) =>
    [
      ...new Set(
        value
          .split(",")
          .filter((id) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              id,
            ),
          )
          .map((id) => id.toLowerCase()),
      ),
    ].slice(0, 100),
  serialize: (value) => value.join(","),
  eq: (a, b) =>
    a.length === b.length && a.every((id, index) => id === b[index]),
}).withDefault([]);
export const panelSearch = {
  servicos: linkedIds,
  profissionais: linkedIds,
  combinarServicos: parseAsStringEnum(["all", "any"]).withDefault("all"),
  combinarProfissionais: parseAsStringEnum(["all", "any"]).withDefault("all"),
  modalidade: parseAsStringEnum(["all", "online", "in_person"]).withDefault(
    "all",
  ),
  tipo: parseAsStringEnum(["all", "individual", "collective"]).withDefault(
    "all",
  ),
  preco: parseAsStringEnum(["all", "free", "paid"]).withDefault("all"),
  ordemServico: parseAsStringEnum([
    "name_asc",
    "name_desc",
    "duration_asc",
    "duration_desc",
    "price_asc",
    "price_desc",
  ]).withDefault("name_asc"),
  ordem: parseAsStringEnum([
    "name_asc",
    "name_desc",
    "services_desc",
    "services_asc",
  ]).withDefault("name_asc"),
  vinculos: parseAsStringEnum(["all", "linked", "unlinked"]).withDefault("all"),
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
  avaliacoes: parseAsStringEnum(["all", "pending"]).withDefault("all"),
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
