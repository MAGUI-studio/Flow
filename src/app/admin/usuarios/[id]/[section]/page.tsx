import { notFound } from "next/navigation";
import {
  adminUser,
  adminAudit,
  requireAdminPage,
  adminPageNumber,
} from "@/lib/admin";
import { adminRecordSections } from "@/lib/admin-records";
import { readAdminFilters } from "@/lib/admin-filters";
import {
  adminRecordDates,
  buildAdminRecordQuery,
} from "@/lib/admin-record-filters";
import { adminRecordFields, adminValueLabels } from "@/lib/admin-labels";
import { db } from "@/lib/db";
import { AdminPagination, AdminEmpty } from "@/components/admin/primitives";
import { AdminRecordsTable } from "@/components/admin/records-table";
import { AdminSearch } from "@/components/admin/search";
import type { SearchInput } from "@/lib/url-state";

const columns: Record<string, string[]> = {
  agendamentos: ["Estabelecimento", "Serviço", "Início", "Situação"],
  estabelecimentos: ["Nome", "Categoria", "Cidade", "Publicado"],
  equipe: ["Profissional", "Estabelecimento", "Ativo"],
  servicos: ["Serviço", "Estabelecimento", "Preço", "Modalidade"],
  sessoes: ["Estabelecimento", "Serviço", "Início", "Capacidade"],
  historico: ["Ação", "Autor", "Quando"],
  avaliacoes: [
    "Estabelecimento",
    "Nota do espaço",
    "Nota do serviço",
    "Enviada em",
  ],
  notificacoes: ["Título", "Criada em", "Lida em"],
  anotacoes: ["Estabelecimento", "Cliente", "Atualizada em"],
  espera: ["Estabelecimento", "Serviço", "Telefone", "Situação"],
  recorrencias: [
    "Estabelecimento",
    "Serviço",
    "Intervalo em semanas",
    "Criada em",
  ],
  reagendamentos: ["Reserva original", "Situação", "Prazo"],
  bloqueios: ["Estabelecimento", "Início", "Fim", "Motivo"],
  favoritos: ["Estabelecimento", "Adicionado em"],
  arquivos: ["Tipo", "Enviada em"],
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; section: string }>;
  searchParams: SearchInput;
}) {
  const actor = await requireAdminPage();
  const { id, section } = await params;
  await adminUser(id);
  if (!Object.hasOwn(adminRecordSections, section)) notFound();
  const definition =
    adminRecordSections[section as keyof typeof adminRecordSections];
  const raw = await searchParams,
    f = readAdminFilters(raw),
    page = adminPageNumber(raw.pagina);
  const sql = buildAdminRecordQuery(definition.query, section, id, f, page);
  await adminAudit(actor.id, `user.view.${section}`, id);
  const [records, count] = await Promise.all([
    db().query<Record<string, unknown>>(sql.sql, sql.values),
    db().query<{ total: string }>(sql.count, sql.countValues),
  ]);
  const states =
    section === "agendamentos"
      ? [
          "confirmed",
          "pending",
          "completed",
          "canceled",
          "expired",
          "declined",
          "no_show",
        ]
      : section === "espera"
        ? ["waiting", "offered", "accepted", "canceled", "expired"]
        : section === "reagendamentos"
          ? ["pending", "approved", "declined", "expired", "canceled"]
          : [];
  return (
    <>
      <p className="mb-5 text-xs text-zinc-500">
        {definition.title} vinculados a esta conta. Horários no fuso de São
        Paulo.
      </p>
      <AdminSearch
        placeholder={`Pesquisar em ${definition.title.toLowerCase()}`}
        filters={[
          ...(states.length ? ["status" as const] : []),
          ...(adminRecordDates[section] ? ["de" as const, "ate" as const] : []),
          "ordem",
          "limite",
        ]}
        options={{
          status: [
            ["all", "Todas as situações"],
            ...states.map((s) => [s, adminValueLabels[s]] as [string, string]),
          ],
        }}
      />
      {records.rowCount ? (
        <AdminRecordsTable
          title={definition.title}
          columns={columns[section] ?? []}
          records={records.rows.map((row, index) => ({
            id: String(row.ID ?? `${page}-${index}`),
            fields: adminRecordFields(row),
          }))}
        />
      ) : (
        <AdminEmpty>
          Nenhum registro corresponde aos filtros selecionados.
        </AdminEmpty>
      )}
      <AdminPagination
        page={page}
        total={Number(count.rows[0].total)}
        path={`/admin/usuarios/${id}/${section}`}
        search={f.busca}
        size={Number(f.limite)}
      />
    </>
  );
}
