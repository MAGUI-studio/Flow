import Link from "next/link";
import {
  adminUser,
  adminDate,
  adminAudit,
  requireAdminPage,
} from "@/lib/admin";
import { isSuperAdmin } from "@/lib/admin-policy";
import { adminDisplayValue } from "@/lib/admin-labels";
import { prisma } from "@/lib/prisma";
import { AdminCard, AdminFields } from "@/components/admin/primitives";
import { AdminActionForm } from "@/components/admin/action-form";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAdminPage();
  const { id } = await params;
  const user = await adminUser(id);
  const account = await prisma().account.findUnique({
    where: { id },
    include: {
      subscription: true,
      _count: {
        select: {
          establishments: true,
          bookings: true,
          favorites: true,
          notifications: true,
        },
      },
    },
  });
  await adminAudit(actor.id, "user.view", id);
  const sub = account?.subscription;
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <AdminCard title="Identidade e contatos">
        <AdminFields
          fields={[
            ["ID da conta", id],
            ["Cadastro no Flow", adminDate(account?.createdAt)],
            ["Cadastro no Clerk", adminDate(user?.createdAt)],
            ["Último login", adminDate(user?.lastSignInAt)],
            ["Última atividade", adminDate(user?.lastActiveAt)],
            ["Nome de usuário", user?.username],
            [
              "E-mails",
              user
                ? user.emailAddresses
                    .map(
                      (e) =>
                        `${e.emailAddress} (${e.verification?.status === "verified" ? "verificado" : "não verificado"})`,
                    )
                    .join(" · ")
                : "Identidade não encontrada",
            ],
            [
              "Telefones",
              user?.phoneNumbers
                .map(
                  (p) =>
                    `${p.phoneNumber} (${adminDisplayValue(p.verification?.status ?? "unverified")})`,
                )
                .join(" · ") || "Não informado",
            ],
            [
              "Provedores conectados",
              user?.externalAccounts
                .map((a) => adminDisplayValue(a.provider))
                .join(", ") || "—",
            ],
            ["ID externo", user?.externalId],
          ]}
        />
      </AdminCard>
      <AdminCard title="Segurança e acesso">
        <AdminFields
          fields={[
            ["Papel", isSuperAdmin(user) ? "Superadministrador" : "Usuário"],
            [
              "Estado do login",
              !user
                ? "Sem identidade"
                : user.banned
                  ? "Bloqueado pela administração"
                  : user.locked
                    ? "Bloqueio de segurança"
                    : "Liberado",
            ],
            [
              "Autenticação em dois fatores",
              user?.twoFactorEnabled ? "Ativa" : "Inativa",
            ],
            ["Conta com senha", user?.passwordEnabled ? "Sim" : "Não"],
          ]}
        />
        {user && !isSuperAdmin(user) && user.id !== actor.id && (
          <div className="mt-6">
            <p className="mb-3 text-xs leading-6 text-zinc-500">
              Bloquear impede o login e revoga as sessões pelo Clerk. Não
              cancela cobranças nem remove automaticamente estabelecimentos do
              catálogo; administre essas opções separadamente.
            </p>
            <AdminActionForm
              key={String(user.banned)}
              target={id}
              action={user.banned ? "unban" : "ban"}
              label={user.banned ? "Desbloquear login" : "Bloquear login"}
            />
          </div>
        )}
      </AdminCard>
      <AdminCard title="Assinatura">
        <AdminFields
          fields={
            sub
              ? [
                  ["Plano", sub.plan === "multi" ? "PRO" : "Essencial"],
                  ["Situação", adminDisplayValue(sub.status)],
                  ["Provedor", adminDisplayValue(sub.provider)],
                  ["Acesso válido até", adminDate(sub.paidUntil)],
                  ["Início do período", adminDate(sub.currentPeriodStart)],
                  [
                    "Cancelamento ao fim do período",
                    sub.cancelAtPeriodEnd ? "Sim" : "Não",
                  ],
                  ["Cliente Stripe", sub.stripeCustomerId],
                  ["Assinatura Stripe", sub.stripeSubscriptionId],
                ]
              : [["Situação", "Sem assinatura cadastrada"]]
          }
        />
      </AdminCard>
      <AdminCard title="Atividade no Flow">
        <AdminFields
          fields={[
            ["Estabelecimentos", account?._count.establishments ?? 0],
            ["Reservas como cliente", account?._count.bookings ?? 0],
            ["Favoritos", account?._count.favorites ?? 0],
            ["Notificações", account?._count.notifications ?? 0],
          ]}
        />
        <Link
          prefetch={false}
          href={`/admin/usuarios/${id}/agendamentos`}
          className="mt-6 inline-block text-xs text-[#635BFF]"
        >
          Consultar histórico de agendamentos →
        </Link>
      </AdminCard>
    </div>
  );
}
