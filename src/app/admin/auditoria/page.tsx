import Link from "next/link";
import { requireAdminPage, adminPageNumber, adminDate } from "@/lib/admin";
import {
  readAdminFilters,
  adminDateRange,
  adminFilterDefaults,
} from "@/lib/admin-filters";
import { adminEventLabel, adminEventDescription } from "@/lib/admin-labels";
import { adminSearchTerms } from "@/lib/admin-record-filters";
import { searchAdminUsers } from "@/lib/admin-directory";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  AdminHeading,
  AdminTable,
  AdminPagination,
  AdminEmpty,
} from "@/components/admin/primitives";
import { AdminSearch } from "@/components/admin/search";
import type { SearchInput } from "@/lib/url-state";
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  await requireAdminPage();
  const raw = await searchParams,
    f = readAdminFilters(raw),
    page = adminPageNumber(raw.pagina),
    size = Number(f.limite);
  const matched = f.busca
    ? (
        await searchAdminUsers({ ...adminFilterDefaults, busca: f.busca }, true)
      ).users.map((u) => u.id)
    : [];
  const and: Prisma.AuditEventWhereInput[] = [];
  if (f.busca)
    and.push({
      OR: [
        ...adminSearchTerms(f.busca).map((term) => ({
          action: { contains: term, mode: "insensitive" as const },
        })),
        { actorId: { contains: f.busca, mode: "insensitive" } },
        { actorId: { in: matched } },
        {
          establishment: {
            is: { name: { contains: f.busca, mode: "insensitive" } },
          },
        },
      ],
    });
  if (f.tipo !== "all")
    and.push({
      action: { startsWith: f.tipo === "stripe" ? "stripe:" : `${f.tipo}.` },
    });
  if (f.evento !== "all")
    and.push({
      OR: [
        { action: f.evento },
        { action: { startsWith: `${f.evento}:` } },
        { action: { startsWith: `stripe:${f.evento}:` } },
      ],
    });
  if (f.de || f.ate) and.push({ createdAt: adminDateRange(f) });
  const where: Prisma.AuditEventWhereInput = { AND: and };
  const [events, total] = await Promise.all([
    prisma().auditEvent.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy:
        f.ordem === "name"
          ? [{ action: "asc" }, { id: "desc" }]
          : [
              { createdAt: f.ordem === "oldest" ? "asc" : "desc" },
              { id: "desc" },
            ],
      include: { establishment: { select: { name: true } } },
    }),
    prisma().auditEvent.count({ where }),
  ]);
  return (
    <>
      <AdminHeading
        title="Auditoria"
        description="Consulte as ações da plataforma, os acessos às fichas e os motivos das alterações administrativas."
      />
      <AdminSearch
        placeholder="Buscar evento em português, responsável, negócio ou motivo"
        filters={["tipo", "evento", "de", "ate", "ordem", "limite"]}
      />
      {events.length ? (
        <AdminTable
          title="Histórico de auditoria"
          headers={[
            "Data e hora",
            "Responsável",
            "Evento",
            "Estabelecimento / reserva",
          ]}
        >
          {events.map((e) => (
            <tr key={String(e.id)}>
              <td className="whitespace-nowrap">{adminDate(e.createdAt)}</td>
              <td>
                {e.actorId ? (
                  <Link prefetch={false} href={`/admin/usuarios/${e.actorId}`}>
                    {e.actorId}
                  </Link>
                ) : (
                  "Sistema"
                )}
              </td>
              <td className="max-w-xl">
                <p className="font-medium text-zinc-800">
                  {adminEventLabel(e.action)}
                </p>
                {adminEventDescription(e.action) && (
                  <p className="mt-1 break-words text-[11px] text-zinc-400">
                    {adminEventDescription(e.action)}
                  </p>
                )}
              </td>
              <td>
                {e.establishment?.name ?? "—"}
                <p className="text-[10px] text-zinc-400">{e.bookingId ?? ""}</p>
              </td>
            </tr>
          ))}
        </AdminTable>
      ) : (
        <AdminEmpty>
          Nenhum evento corresponde aos filtros selecionados.
        </AdminEmpty>
      )}
      <AdminPagination
        page={page}
        total={total}
        path="/admin/auditoria"
        search={f.busca}
        size={size}
      />
    </>
  );
}
