import { clerkClient } from "@clerk/nextjs/server";
import {
  adminUser,
  adminAudit,
  requireAdminPage,
  adminPageNumber,
  adminDate,
} from "@/lib/admin";
import { readAdminFilters, adminDateRange } from "@/lib/admin-filters";
import { adminDisplayValue } from "@/lib/admin-labels";
import { AdminEmpty, AdminPagination } from "@/components/admin/primitives";
import { AdminRecordsTable } from "@/components/admin/records-table";
import { AdminSearch } from "@/components/admin/search";
import type { SearchInput } from "@/lib/url-state";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchInput;
}) {
  const actor = await requireAdminPage();
  const { id } = await params;
  const user = await adminUser(id);
  if (!user)
    return (
      <AdminEmpty>
        Esta conta não possui identidade de acesso vinculada.
      </AdminEmpty>
    );
  const raw = await searchParams,
    f = readAdminFilters(raw),
    page = adminPageNumber(raw.pagina),
    size = Number(f.limite),
    range = adminDateRange(f);
  await adminAudit(actor.id, "user.view.sessions", id);
  const clerk = await clerkClient(),
    all = [];
  while (true) {
    const batch = await clerk.sessions.getSessionList({
      userId: id,
      limit: 100,
      offset: all.length,
    });
    all.push(...batch.data);
    if (!batch.data.length || all.length >= batch.totalCount) break;
  }
  let filtered = all.filter(
    (s) =>
      (f.status === "all" || s.status === f.status) &&
      (!range.gte || s.createdAt >= range.gte.getTime()) &&
      (!range.lt || s.createdAt < range.lt.getTime()) &&
      (!f.busca ||
        [
          s.id,
          adminDisplayValue(s.status),
          s.latestActivity?.browserName,
          s.latestActivity?.deviceType,
          s.latestActivity?.ipAddress,
          s.latestActivity?.city,
          s.latestActivity?.country,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(f.busca.toLocaleLowerCase("pt-BR"))),
  );
  filtered.sort((a, b) =>
    f.ordem === "oldest"
      ? a.createdAt - b.createdAt
      : f.ordem === "name"
        ? a.id.localeCompare(b.id)
        : b.createdAt - a.createdAt,
  );
  const total = filtered.length;
  filtered = filtered.slice((page - 1) * size, page * size);
  return (
    <>
      <AdminSearch
        placeholder="Buscar navegador, dispositivo, localização ou endereço IP"
        filters={["status", "de", "ate", "ordem", "limite"]}
        options={{
          status: [
            ["all", "Todas as sessões"],
            ...["active", "ended", "revoked", "expired", "abandoned"].map(
              (s) => [s, adminDisplayValue(s)] as [string, string],
            ),
          ],
        }}
      />
      {filtered.length ? (
        <AdminRecordsTable
          title="Sessões de acesso"
          columns={["Navegador", "Dispositivo", "Situação", "Última atividade"]}
          records={filtered.map((s) => ({
            id: s.id,
            fields: [
              ["Identificador", s.id],
              ["Situação", adminDisplayValue(s.status)],
              ["Criada em", adminDate(s.createdAt)],
              ["Última atividade", adminDate(s.lastActiveAt)],
              ["Expira em", adminDate(s.expireAt)],
              ["Navegador", s.latestActivity?.browserName ?? "—"],
              [
                "Dispositivo",
                s.latestActivity?.deviceType
                  ? adminDisplayValue(s.latestActivity.deviceType)
                  : "—",
              ],
              ["Endereço IP", s.latestActivity?.ipAddress ?? "—"],
              [
                "Localização aproximada",
                [s.latestActivity?.city, s.latestActivity?.country]
                  .filter(Boolean)
                  .join(", ") || "—",
              ],
            ],
          }))}
        />
      ) : (
        <AdminEmpty>
          Nenhuma sessão corresponde aos filtros selecionados.
        </AdminEmpty>
      )}
      <AdminPagination
        page={page}
        total={total}
        path={`/admin/usuarios/${id}/acessos`}
        search={f.busca}
        size={size}
      />
    </>
  );
}
