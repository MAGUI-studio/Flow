import { z } from "zod";
import { parseAsString } from "nuqs/server";
import { adminEventLabels, adminValueLabels } from "./admin-labels";

export const adminFilterKeys = [
  "status",
  "plano",
  "acesso",
  "publicacao",
  "provedor",
  "tipo",
  "evento",
  "ordem",
  "de",
  "ate",
  "limite",
] as const;
export type AdminFilterKey = (typeof adminFilterKeys)[number];
const isoDate = z
  .string()
  .refine(
    (v) =>
      !v ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !Number.isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v),
    "Informe uma data válida.",
  );
export const adminFilterSchema = z
  .object({
    busca: z.string().trim().max(150, "Use até 150 caracteres."),
    status: z.string().max(40),
    plano: z.enum(["all", "basic", "multi", "none"]),
    acesso: z.enum(["all", "normal", "banned", "locked", "admin"]),
    publicacao: z.enum(["all", "visible", "draft", "inactive", "restricted"]),
    provedor: z.enum(["all", "stripe", "development", "seed"]),
    tipo: z.enum([
      "all",
      "booking",
      "business",
      "schedule",
      "admin",
      "stripe",
      "with_business",
      "consumer",
    ]),
    evento: z.string().max(90),
    ordem: z.enum(["newest", "oldest", "name"]),
    de: isoDate,
    ate: isoDate,
    limite: z.enum(["25", "50", "100"]),
  })
  .refine((v) => !v.de || !v.ate || v.ate >= v.de, {
    path: ["ate"],
    message: "A data final deve ser igual ou posterior à inicial.",
  });
export type AdminFilters = z.infer<typeof adminFilterSchema>;
export const adminFilterDefaults: AdminFilters = {
  busca: "",
  status: "all",
  plano: "all",
  acesso: "all",
  publicacao: "all",
  provedor: "all",
  tipo: "all",
  evento: "all",
  ordem: "newest",
  de: "",
  ate: "",
  limite: "25",
};
export const adminFilterParsers = Object.fromEntries(
  Object.entries(adminFilterDefaults).map(([key, value]) => [
    key,
    parseAsString.withDefault(value),
  ]),
) as Record<keyof AdminFilters, ReturnType<typeof parseAsString.withDefault>>;
export function readAdminFilters(
  raw: Record<string, string | string[] | undefined>,
): AdminFilters {
  const values = Object.fromEntries(
    Object.entries(adminFilterDefaults).map(([key, fallback]) => [
      key,
      typeof raw[key] === "string" ? raw[key] : fallback,
    ]),
  );
  const parsed = adminFilterSchema.safeParse(values);
  return parsed.success
    ? parsed.data
    : {
        ...adminFilterDefaults,
        busca: typeof raw.busca === "string" ? raw.busca.slice(0, 150) : "",
      };
}
export function adminDateRange(filters: AdminFilters) {
  return {
    ...(filters.de ? { gte: new Date(`${filters.de}T00:00:00-03:00`) } : {}),
    ...(filters.ate
      ? {
          lt: new Date(
            new Date(`${filters.ate}T00:00:00-03:00`).getTime() + 86400000,
          ),
        }
      : {}),
  };
}
export const adminFilterOptions: Partial<
  Record<AdminFilterKey, { label: string; options: [string, string][] }>
> = {
  status: {
    label: "Situação",
    options: [
      ["all", "Todas as situações"],
      ...[
        "active",
        "past_due",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "canceled",
        "paused",
      ].map((v) => [v, adminValueLabels[v]] as [string, string]),
    ],
  },
  plano: {
    label: "Plano",
    options: [
      ["all", "Todos os planos"],
      ["basic", "Essencial"],
      ["multi", "PRO"],
      ["none", "Sem assinatura"],
    ],
  },
  acesso: {
    label: "Acesso",
    options: [
      ["all", "Todos os acessos"],
      ["normal", "Login liberado"],
      ["banned", "Login bloqueado"],
      ["locked", "Bloqueio de segurança"],
      ["admin", "Superadministrador"],
    ],
  },
  publicacao: {
    label: "Publicação",
    options: [
      ["all", "Todas as situações"],
      ["visible", "Visível no catálogo"],
      ["draft", "Rascunho / retirado do ar"],
      ["inactive", "Inativo"],
      ["restricted", "Sem assinatura válida"],
    ],
  },
  provedor: {
    label: "Provedor",
    options: [
      ["all", "Todos os provedores"],
      ["stripe", "Stripe"],
      ["development", "Desenvolvimento"],
      ["seed", "Demonstração"],
    ],
  },
  tipo: {
    label: "Categoria",
    options: [
      ["all", "Todas as categorias"],
      ["booking", "Agendamentos"],
      ["business", "Estabelecimentos"],
      ["schedule", "Agenda"],
      ["admin", "Administração"],
      ["stripe", "Pagamentos"],
    ],
  },
  evento: {
    label: "Evento",
    options: [["all", "Todos os eventos"], ...Object.entries(adminEventLabels)],
  },
  ordem: {
    label: "Ordenação",
    options: [
      ["newest", "Mais recentes"],
      ["oldest", "Mais antigos"],
      ["name", "Nome ou referência"],
    ],
  },
  limite: {
    label: "Por página",
    options: [
      ["25", "25 registros"],
      ["50", "50 registros"],
      ["100", "100 registros"],
    ],
  },
};
