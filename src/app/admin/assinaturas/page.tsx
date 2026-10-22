import Link from "next/link";
import { requireAdminPage, adminPageNumber, adminDate } from "@/lib/admin";
import {
  readAdminFilters,
  adminDateRange,
  adminFilterDefaults,
  adminFilterOptions,
} from "@/lib/admin-filters";
import { searchAdminUsers } from "@/lib/admin-directory";
import { adminDisplayValue } from "@/lib/admin-labels";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  AdminHeading,
  AdminTable,
  AdminPagination,
  AdminEmpty,
  AdminSubscriptionStatus,
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
  const where: Prisma.SubscriptionWhereInput = {
    ...(f.busca
      ? {
          OR: [
            ...["ownerId", "stripeCustomerId", "stripeSubscriptionId"].map(
              (key) => ({
                [key]: { contains: f.busca, mode: "insensitive" as const },
              }),
            ),
            { ownerId: { in: matched } },
          ],
        }
      : {}),
    ...(f.status !== "all" ? { status: f.status } : {}),
    ...(f.plano !== "all" ? { plan: f.plano } : {}),
    ...(f.provedor !== "all" ? { provider: f.provedor } : {}),
    ...(f.de || f.ate ? { currentPeriodStart: adminDateRange(f) } : {}),
  };
  const [subscriptions, total] = await Promise.all([
    prisma().subscription.findMany({
      where,
      skip: (page - 1) * size,
      take: size,
      orderBy:
        f.ordem === "name"
          ? { ownerId: "asc" }
          : [
              { currentPeriodStart: f.ordem === "oldest" ? "asc" : "desc" },
              { ownerId: "asc" },
            ],
    }),
    prisma().subscription.count({ where }),
  ]);
  return (
    <>
      <AdminHeading
        title="Assinaturas"
        description="Acompanhe planos, pagamentos e períodos de acesso. Os pagamentos são processados pelo Stripe."
      />
      <AdminSearch
        placeholder="Buscar responsável, e-mail ou referência de pagamento"
        filters={[
          "status",
          "plano",
          "provedor",
          "de",
          "ate",
          "ordem",
          "limite",
        ]}
        options={{
          plano: adminFilterOptions.plano!.options.filter(
            ([v]) => v !== "none",
          ),
        }}
      />
      {subscriptions.length ? (
        <AdminTable
          title="Assinaturas da plataforma"
          description="Período filtrado pela data de início"
          headers={[
            "Conta",
            "Plano",
            "Situação",
            "Período",
            "Referências de pagamento",
          ]}
        >
          {subscriptions.map((s) => (
            <tr key={s.ownerId}>
              <td>
                <Link prefetch={false} href={`/admin/usuarios/${s.ownerId}`}>
                  {s.ownerId}
                </Link>
              </td>
              <td className="whitespace-nowrap font-medium text-zinc-700!">
                {s.plan === "multi" ? "Flow PRO" : "Flow Essencial"}
              </td>
              <td>
                <AdminSubscriptionStatus status={s.status} />
                <p className="mt-1 text-[11px] text-zinc-400">
                  {adminDisplayValue(s.provider)} ·{" "}
                  {s.status === "active" && s.paidUntil > new Date()
                    ? "Acesso válido"
                    : "Acesso restrito"}
                </p>
              </td>
              <td className="whitespace-nowrap">
                {adminDate(s.currentPeriodStart)}
                <br />
                até {adminDate(s.paidUntil)}
                {s.cancelAtPeriodEnd && (
                  <p className="mt-1 text-[10px] text-amber-700">
                    Cancelamento programado
                  </p>
                )}
              </td>
              <td>
                <p className="text-[10px]">{s.stripeCustomerId ?? "—"}</p>
                <p className="text-[10px] text-zinc-400">
                  {s.stripeSubscriptionId ?? "—"}
                </p>
              </td>
            </tr>
          ))}
        </AdminTable>
      ) : (
        <AdminEmpty>
          Nenhuma assinatura corresponde aos filtros selecionados.
        </AdminEmpty>
      )}
      <AdminPagination
        page={page}
        total={total}
        path="/admin/assinaturas"
        search={f.busca}
        size={size}
      />
    </>
  );
}
