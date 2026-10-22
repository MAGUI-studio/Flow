import type { AdminFilters } from "./admin-filters";
import { adminValueLabels, adminEventLabels } from "./admin-labels";

export const adminRecordDates: Record<string, string> = {
  sessoes: "Início",
  arquivos: "Enviada em",
  historico: "Quando",
  agendamentos: "Início",
  avaliacoes: "Enviada em",
  favoritos: "Adicionado em",
  notificacoes: "Criada em",
  anotacoes: "Atualizada em",
  espera: "Criada em",
  recorrencias: "Criada em",
  reagendamentos: "Criado em",
  bloqueios: "Início",
};
export function adminSearchTerms(search: string) {
  const normalized = search
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return [
    ...new Set([
      search,
      ...Object.entries({ ...adminValueLabels, ...adminEventLabels })
        .filter(([, label]) =>
          label
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .includes(normalized),
        )
        .map(([key]) => key),
    ]),
  ];
}
export function buildAdminRecordQuery(
  query: string,
  section: string,
  id: string,
  filters: AdminFilters,
  page: number,
) {
  const values: unknown[] = [id];
  const conditions: string[] = [];
  const bind = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };
  const aliases = [...query.matchAll(/AS "([^"]+)"/g)].map((match) => match[1]);
  const dateField = adminRecordDates[section];
  if (filters.busca)
    conditions.push(
      `row_to_json(records)::text ILIKE ANY(${bind(adminSearchTerms(filters.busca).map((term) => `%${term.replace(/[\\%_]/g, "\\$&")}%`))}::text[])`,
    );
  if (filters.status !== "all" && aliases.includes("Status"))
    conditions.push(`records."Status"=${bind(filters.status)}`);
  if (dateField && filters.de)
    conditions.push(
      `records."${dateField}">=${bind(`${filters.de}T00:00:00-03:00`)}::timestamptz`,
    );
  if (dateField && filters.ate)
    conditions.push(
      `records."${dateField}"<(${bind(`${filters.ate}T00:00:00-03:00`)}::timestamptz+interval '1 day')`,
    );
  const base = `FROM (${query}) records${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""}`;
  const orderField =
    filters.ordem !== "name" && dateField
      ? dateField
      : (aliases.find((key) =>
          ["Nome", "Estabelecimento", "Título", "Ação", "Serviço"].includes(
            key,
          ),
        ) ?? aliases[0]);
  const count = `SELECT count(*)::text AS total ${base}`;
  const countValues = [...values];
  const sql = `SELECT * ${base} ORDER BY records."${orderField}" ${filters.ordem === "oldest" || filters.ordem === "name" ? "ASC" : "DESC"} NULLS LAST LIMIT ${bind(Number(filters.limite))} OFFSET ${bind((page - 1) * Number(filters.limite))}`;
  return { sql, values, count, countValues };
}
