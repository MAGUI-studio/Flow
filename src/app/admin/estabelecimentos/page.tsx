import Link from "next/link";
import { requireAdminPage, adminPageNumber } from "@/lib/admin";
import { readAdminFilters, adminFilterDefaults } from "@/lib/admin-filters";
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
import { AdminActionForm } from "@/components/admin/action-form";
import { StatusBadge } from "@/components/ui/statusBadge";
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
    size = Number(f.limite),
    now = new Date();
  const matched = f.busca
    ? (
        await searchAdminUsers({ ...adminFilterDefaults, busca: f.busca }, true)
      ).users.map((u) => u.id)
    : [];
  const valid = { status: "active", paidUntil: { gt: now } };
  const and: Prisma.EstablishmentWhereInput[] = [];
  if (f.busca)
    and.push({
      OR: [
        { name: { contains: f.busca, mode: "insensitive" } },
        { slug: { contains: f.busca, mode: "insensitive" } },
        { ownerId: { contains: f.busca, mode: "insensitive" } },
        { ownerId: { in: matched } },
      ],
    });
  if (f.plano !== "all")
    and.push({
      owner: {
        subscription:
          f.plano === "none" ? { is: null } : { is: { plan: f.plano } },
      },
    });
  if (f.publicacao === "visible")
    and.push({
      active: true,
      published: true,
      owner: { subscription: { is: valid } },
    });
  if (f.publicacao === "draft") and.push({ active: true, published: false });
  if (f.publicacao === "inactive") and.push({ active: false });
  if (f.publicacao === "restricted")
    and.push({
      active: true,
      published: true,
      owner: {
        OR: [
          { subscription: { is: null } },
          { subscription: { isNot: valid } },
        ],
      },
    });
  const where: Prisma.EstablishmentWhereInput = { AND: and };
  const [businesses, total] = await Promise.all([
    prisma().establishment.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy: [{ name: f.ordem === "oldest" ? "desc" : "asc" }, { id: "asc" }],
      include: {
        owner: {
          select: {
            subscription: { select: { status: true, paidUntil: true } },
          },
        },
        _count: { select: { professionals: true, services: true } },
      },
    }),
    prisma().establishment.count({ where }),
  ]);
  return (
    <>
      <AdminHeading
        title="Estabelecimentos"
        description="Gerencie a publicação dos negócios e acompanhe a estrutura de cada unidade."
      />
      <AdminSearch
        placeholder="Buscar negócio, responsável, e-mail ou endereço público"
        filters={["publicacao", "plano", "ordem", "limite"]}
        options={{
          ordem: [
            ["newest", "Nome: A–Z"],
            ["oldest", "Nome: Z–A"],
          ],
        }}
      />
      {businesses.length ? (
        <AdminTable
          title="Todos os estabelecimentos"
          headers={[
            "Estabelecimento",
            "Responsável",
            "Publicação",
            "Estrutura",
            "Ações",
          ]}
        >
          {businesses.map((b) => {
            const s = b.owner.subscription,
              visible =
                b.active &&
                b.published &&
                s?.status === "active" &&
                s.paidUntil > now;
            return (
              <tr key={b.id}>
                <td>
                  <p className="font-semibold text-zinc-800">{b.name}</p>
                  <p className="text-[11px] text-zinc-400">
                    /{b.slug} · {b.city ?? "Online"}
                  </p>
                  <Link
                    prefetch={false}
                    href={`/admin/usuarios/${b.ownerId}/estabelecimentos`}
                    className="mt-1 inline-block text-[11px]"
                  >
                    Ver informações
                  </Link>
                </td>
                <td>
                  <Link
                    prefetch={false}
                    href={`/admin/usuarios/${b.ownerId}`}
                    className="text-[11px]"
                  >
                    {b.ownerId}
                  </Link>
                </td>
                <td>
                  <StatusBadge
                    status={
                      visible
                        ? "active"
                        : !b.active
                          ? "inactive"
                          : !b.published
                            ? "pending"
                            : "declined"
                    }
                    label={
                      visible
                        ? "Visível no catálogo"
                        : !b.active
                          ? "Inativo"
                          : !b.published
                            ? "Rascunho / retirado do ar"
                            : "Sem assinatura válida"
                    }
                  />
                </td>
                <td>
                  {b._count.professionals} profissionais
                  <br />
                  {b._count.services} serviços
                </td>
                <td>
                  {b.active && (
                    <AdminActionForm
                      key={`${b.id}-${b.published}`}
                      target={b.id}
                      action={b.published ? "hide" : "publish"}
                      label={b.published ? "Retirar do ar" : "Publicar página"}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      ) : (
        <AdminEmpty>
          Nenhum estabelecimento corresponde aos filtros selecionados.
        </AdminEmpty>
      )}
      <AdminPagination
        page={page}
        total={total}
        path="/admin/estabelecimentos"
        search={f.busca}
        size={size}
      />
    </>
  );
}
