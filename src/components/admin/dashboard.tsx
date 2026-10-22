import Link from "next/link";
import {
  Users,
  Database,
  Building2,
  CreditCard,
  CalendarDays,
  CircleAlert,
  ArrowUpRight,
} from "lucide-react";
import { AdminHeading, AdminTable, AdminCard, AdminEmpty } from "./primitives";

export function AdminDashboard({
  counts,
  recentUsers,
  recentEvents,
}: {
  counts: number[];
  recentUsers: { id: string; name: string; email: string; created: string }[];
  recentEvents: { id: string; label: string; date: string; business: string }[];
}) {
  const metrics = [
    {
      label: "Usuários",
      href: "/admin/usuarios",
      icon: Users,
      note: "Cadastros com acesso à plataforma",
    },
    {
      label: "Contas no Flow",
      href: "/admin/contas",
      icon: Database,
      note: "Registros ativos e históricos",
    },
    {
      label: "Estabelecimentos",
      href: "/admin/estabelecimentos",
      icon: Building2,
      note: "Todas as unidades cadastradas",
    },
    {
      label: "Assinaturas com acesso",
      href: "/admin/assinaturas?status=active",
      icon: CreditCard,
      note: "Planos ativos dentro da validade",
    },
    {
      label: "Agendamentos",
      href: "/admin/agendamentos",
      icon: CalendarDays,
      note: "Reservas registradas na plataforma",
    },
    {
      label: "Pendências de acesso",
      href: "/admin/assinaturas",
      icon: CircleAlert,
      note: "Pagamento em atraso ou validade encerrada",
    },
  ];
  return (
    <>
      <AdminHeading
        title="Visão geral"
        description="Acompanhe a operação do Flow, os novos cadastros e as movimentações da plataforma."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric, index) => (
          <Link
            prefetch={false}
            key={metric.label}
            href={metric.href}
            className="metric-card relative isolate block overflow-hidden transition-colors hover:border-[#635BFF]/35"
          >
            <div>
              <span>{metric.label}</span>
              <i
                aria-hidden="true"
                className="pointer-events-none absolute -right-3 -bottom-5 -z-10 rotate-[-12deg] bg-transparent! p-0! opacity-[.08]"
              >
                <metric.icon className="size-28 stroke-[1.2]" />
              </i>
            </div>
            <strong className="tabular-nums">
              {counts[index].toLocaleString("pt-BR")}
            </strong>
            <small>{metric.note}</small>
          </Link>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="min-w-0">
          {recentUsers.length ? (
            <AdminTable
              title="Novos usuários"
              headers={["Usuário", "Cadastro"]}
            >
              {recentUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link
                      prefetch={false}
                      href={`/admin/usuarios/${user.id}`}
                      className="font-semibold text-zinc-800!"
                    >
                      {user.name}
                    </Link>
                    <p className="text-[11px] text-zinc-400">{user.email}</p>
                  </td>
                  <td className="whitespace-nowrap">{user.created}</td>
                </tr>
              ))}
            </AdminTable>
          ) : (
            <AdminEmpty>Ainda não há usuários para exibir.</AdminEmpty>
          )}
          <Link
            prefetch={false}
            href="/admin/usuarios"
            className="mt-3 inline-flex items-center gap-1 text-xs text-[#635BFF]"
          >
            Todos os usuários
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
        <div className="min-w-0">
          {recentEvents.length ? (
            <AdminTable
              title="Últimas movimentações"
              headers={["Evento", "Data"]}
            >
              {recentEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    <p className="font-medium text-zinc-700">{event.label}</p>
                    <p className="text-[11px] text-zinc-400">
                      {event.business}
                    </p>
                  </td>
                  <td className="whitespace-nowrap">{event.date}</td>
                </tr>
              ))}
            </AdminTable>
          ) : (
            <AdminEmpty>Ainda não há eventos para exibir.</AdminEmpty>
          )}
          <Link
            prefetch={false}
            href="/admin/auditoria"
            className="mt-3 inline-flex items-center gap-1 text-xs text-[#635BFF]"
          >
            Abrir auditoria
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
