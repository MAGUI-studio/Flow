import Link from "next/link";
import {
  adminEmail,
  adminName,
  adminDate,
  adminPageNumber,
  requireAdminPage,
} from "@/lib/admin";
import { isSuperAdmin } from "@/lib/admin-policy";
import { adminUserDirectory } from "@/lib/admin-directory";
import { readAdminFilters } from "@/lib/admin-filters";
import {
  AdminHeading,
  AdminTable,
  AdminPagination,
  AdminEmpty,
  AdminSubscriptionStatus,
} from "@/components/admin/primitives";
import { AdminSearch } from "@/components/admin/search";
import { StatusBadge } from "@/components/ui/statusBadge";
import type { SearchInput } from "@/lib/url-state";

export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  await requireAdminPage();
  const raw = await searchParams,
    filters = readAdminFilters(raw),
    page = adminPageNumber(raw.pagina);
  const { users, total, accounts } = await adminUserDirectory(filters, page);
  return (
    <>
      <AdminHeading
        title="Usuários"
        description="Consulte os cadastros, acompanhe os acessos e abra a ficha completa de cada pessoa."
      />
      <AdminSearch
        filters={["acesso", "plano", "de", "ate", "ordem", "limite"]}
      />
      {users.length ? (
        <AdminTable
          title="Usuários cadastrados"
          description="Contatos e atividade na plataforma"
          headers={["Usuário", "Acesso", "Assinatura", "Atividade", "Cadastro"]}
        >
          {users.map((user) => {
            const account = accounts.get(user.id),
              name = adminName(user);
            return (
              <tr key={user.id}>
                <td>
                  <div className="flex min-w-56 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#F5F4FF] text-xs font-semibold text-[#635BFF]">
                      {name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <Link
                        prefetch={false}
                        href={`/admin/usuarios/${user.id}`}
                        className="font-semibold text-zinc-800!"
                      >
                        {name}
                      </Link>
                      <p className="text-[11px] text-zinc-400">
                        {adminEmail(user)}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <StatusBadge
                    status={
                      user.banned
                        ? "declined"
                        : user.locked
                          ? "pending"
                          : "active"
                    }
                    label={
                      isSuperAdmin(user)
                        ? "Superadministrador"
                        : user.banned
                          ? "Login bloqueado"
                          : user.locked
                            ? "Bloqueio de segurança"
                            : "Login liberado"
                    }
                  />
                </td>
                <td>
                  {account?.subscription ? (
                    <>
                      <p className="mb-1 font-medium text-zinc-700">
                        {account.subscription.plan === "multi"
                          ? "Flow PRO"
                          : "Flow Essencial"}
                      </p>
                      <AdminSubscriptionStatus
                        status={account.subscription.status}
                      />
                    </>
                  ) : (
                    <span className="text-zinc-400">Sem assinatura</span>
                  )}
                </td>
                <td>
                  <p>{account?._count.establishments ?? 0} negócios</p>
                  <p className="text-[11px] text-zinc-400">
                    {account?._count.bookings ?? 0} reservas
                  </p>
                </td>
                <td className="whitespace-nowrap">
                  {adminDate(user.createdAt)}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      ) : (
        <AdminEmpty>
          Nenhum usuário corresponde aos filtros selecionados.
        </AdminEmpty>
      )}
      <AdminPagination
        page={page}
        total={total}
        path="/admin/usuarios"
        search={filters.busca}
        size={Number(filters.limite)}
      />
    </>
  );
}
