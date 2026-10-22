import Link from "next/link";
import {
  adminName,
  adminEmail,
  adminDate,
  adminPageNumber,
  requireAdminPage,
} from "@/lib/admin";
import {
  readAdminFilters,
  adminDateRange,
  adminFilterDefaults,
} from "@/lib/admin-filters";
import { searchAdminUsers } from "@/lib/admin-directory";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
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
  const where: Prisma.AccountWhereInput = {
    ...(f.busca
      ? {
          OR: [
            { id: { contains: f.busca, mode: "insensitive" } },
            { id: { in: matched } },
          ],
        }
      : {}),
    ...(f.de || f.ate ? { createdAt: adminDateRange(f) } : {}),
    ...(f.plano === "none"
      ? { subscription: { is: null } }
      : f.plano !== "all"
        ? { subscription: { is: { plan: f.plano } } }
        : {}),
    ...(f.tipo === "with_business"
      ? { establishments: { some: {} } }
      : f.tipo === "consumer"
        ? { establishments: { none: {} } }
        : {}),
  };
  const [accounts, total] = await Promise.all([
    prisma().account.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy:
        f.ordem === "name"
          ? { id: "asc" }
          : [
              { createdAt: f.ordem === "oldest" ? "asc" : "desc" },
              { id: "asc" },
            ],
      include: { _count: { select: { establishments: true, bookings: true } } },
    }),
    prisma().account.count({ where }),
  ]);
  const clerk = await clerkClient();
  const users = accounts.length
      ? (
          await clerk.users.getUserList({
            userId: accounts.map((a) => a.id),
            limit: 100,
          })
        ).data
      : [],
    byId = new Map(users.map((u) => [u.id, u]));
  return (
    <>
      <AdminHeading
        title="Contas no banco"
        description="Acompanhe os registros do Flow, incluindo contas legadas e cadastros de demonstração."
      />
      <AdminSearch
        placeholder="Buscar nome, e-mail ou identificador"
        filters={["plano", "tipo", "de", "ate", "ordem", "limite"]}
        options={{
          tipo: [
            ["all", "Todas as contas"],
            ["with_business", "Com estabelecimentos"],
            ["consumer", "Sem estabelecimentos"],
          ],
        }}
      />
      {accounts.length ? (
        <AdminTable
          title="Contas cadastradas"
          headers={["Conta", "Contato", "Negócios", "Reservas", "Cadastro"]}
        >
          {accounts.map((a) => {
            const u = byId.get(a.id);
            return (
              <tr key={a.id}>
                <td>
                  <Link
                    prefetch={false}
                    href={`/admin/usuarios/${a.id}`}
                    className="font-semibold text-zinc-800!"
                  >
                    {u ? adminName(u) : "Conta legada"}
                  </Link>
                  <p className="text-[10px] text-zinc-400">{a.id}</p>
                </td>
                <td>
                  {u ? adminEmail(u) : "Sem identidade de acesso vinculada"}
                </td>
                <td>{a._count.establishments}</td>
                <td>{a._count.bookings}</td>
                <td className="whitespace-nowrap">{adminDate(a.createdAt)}</td>
              </tr>
            );
          })}
        </AdminTable>
      ) : (
        <AdminEmpty>
          Nenhuma conta corresponde aos filtros selecionados.
        </AdminEmpty>
      )}
      <AdminPagination
        page={page}
        total={total}
        path="/admin/contas"
        search={f.busca}
        size={size}
      />
    </>
  );
}
