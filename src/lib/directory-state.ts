import {
  createSerializer,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
export const directorySearch = {
  busca: parseAsString.withDefault(""),
  cidade: parseAsString.withDefault(""),
  categoria: parseAsString.withDefault("Todos"),
  modalidade: parseAsStringEnum(["all", "in_person", "online"]).withDefault(
    "all",
  ),
};
export const directoryHref = createSerializer(directorySearch);
export function filterDirectory<
  T extends {
    name: string;
    tag: string;
    city: string;
    category: string;
    serviceNames: string[];
    modalities: string[];
  },
>(
  rows: T[],
  query: {
    busca: string;
    cidade: string;
    categoria: string;
    modalidade: string;
  },
) {
  const normalize = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
  return rows.filter(
    (b) =>
      (query.categoria === "Todos" || b.category === query.categoria) &&
      normalize(`${b.name} ${b.tag} ${b.serviceNames.join(" ")}`).includes(
        normalize(query.busca),
      ) &&
      normalize(b.city).includes(normalize(query.cidade)) &&
      (query.modalidade === "all" || b.modalities.includes(query.modalidade)),
  );
}
