import {
  createSerializer,
  parseAsString,
  parseAsInteger,
  parseAsStringEnum,
} from "nuqs/server";
export const directorySearch = {
  area: parseAsString.withDefault(""),
  pagina: parseAsInteger.withDefault(1),
  busca: parseAsString.withDefault(""),
  cidade: parseAsString.withDefault(""),
  categoria: parseAsString.withDefault("Todos"),
  modalidade: parseAsStringEnum(["all", "in_person", "online"]).withDefault(
    "all",
  ),
};
export type MapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};
export function parseMapBounds(value: string): MapBounds | null {
  const parts = value.split(",");
  if (parts.length !== 4 || parts.some((p) => !p.trim())) return null;
  const [south, west, north, east] = parts.map(Number);
  if (
    ![south, west, north, east].every(Number.isFinite) ||
    south < -90 ||
    north > 90 ||
    west < -180 ||
    east > 180 ||
    south >= north ||
    west >= east
  )
    return null;
  return { south, west, north, east };
}
export function inMapBounds(
  point: { latitude: number; longitude: number } | undefined,
  bounds: MapBounds,
) {
  return (
    !!point &&
    point.latitude >= bounds.south &&
    point.latitude <= bounds.north &&
    point.longitude >= bounds.west &&
    point.longitude <= bounds.east
  );
}
export const directoryHref = createSerializer(directorySearch);
export function paginateDirectory<T>(rows: T[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / 8));
  const page = Math.max(1, Math.min(totalPages, requestedPage));
  return { page, totalPages, rows: rows.slice((page - 1) * 8, page * 8) };
}
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
