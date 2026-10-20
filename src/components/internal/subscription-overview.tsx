import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Check,
  Layers,
  Sparkles,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { planFeatures } from "@/lib/plan-features";
import { panelHref } from "@/lib/url-state";
import { StatusBadge } from "@/components/ui/statusBadge";
type Props = {
  subscription: {
    plan: string;
    currentPeriodStart: Date;
    paidUntil: Date;
    cancelAtPeriodEnd: boolean;
  };
  businesses: { id: string; name: string; professionals: number }[];
  timezone: string;
};
function Usage({
  label,
  count,
  limit,
}: {
  label: string;
  count: number;
  limit: number;
}) {
  const full = count >= limit;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="text-xs tabular-nums text-zinc-700">
          <strong className="font-semibold">{count}</strong>
          <span className="text-zinc-400"> / {limit}</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(count, limit)}
        className="h-1.5 overflow-hidden rounded-full bg-zinc-100"
      >
        <div
          className={`h-full rounded-full ${full ? "bg-amber-500" : "bg-[#635BFF]"}`}
          style={{ width: `${Math.min(100, (count / limit) * 100)}%` }}
        />
      </div>
      {full && (
        <p className="m-0 text-[11px] text-amber-700">
          Limite do plano atingido
        </p>
      )}
    </div>
  );
}
export function SubscriptionOverview({
  subscription,
  businesses,
  timezone,
}: Props) {
  const features = planFeatures(subscription.plan);
  const date = (value: Date) =>
    value.toLocaleDateString("pt-BR", {
      timeZone: timezone,
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const benefits = [
    {
      icon: Building2,
      title: `Até ${features.establishments} ${features.establishments === 1 ? "estabelecimento" : "estabelecimentos"}`,
      description: "Cada espaço com sua página e equipe.",
    },
    {
      icon: Users,
      title: `${features.professionals} profissionais por espaço`,
      description: "Horários semanais e disponibilidade individual.",
    },
    {
      icon: CalendarDays,
      title: "Agenda e reservas online",
      description: "Atendimentos individuais, turmas e controle de chegada.",
    },
    {
      icon: Layers,
      title: features.reports
        ? "Relatórios e exportação CSV"
        : "Página personalizada",
      description: features.reports
        ? "Acompanhe os resultados do seu negócio."
        : "Escolha entre os templates Flow e Essência.",
    },
  ];
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <section
          aria-labelledby="current-plan-title"
          className="relative isolate overflow-hidden rounded-2xl border border-zinc-200 bg-white"
        >
          <Sparkles
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 -z-10 size-56 -rotate-12 text-[#635BFF] opacity-[0.04]"
          />
          <div className="px-5 py-6 sm:px-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Seu plano atual
              </span>
              <StatusBadge status="active" label="Assinatura ativa" />
            </div>
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#F5F4FF] text-[#635BFF]">
                <Sparkles size={23} aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="current-plan-title"
                  className="m-0 text-3xl font-semibold tracking-tight text-zinc-900"
                >
                  {features.name}
                </h2>
                <p className="mb-0 mt-1 text-sm text-zinc-500">
                  Tudo pronto para organizar os próximos atendimentos.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-5 border-t border-zinc-100 bg-zinc-50/60 px-5 py-5 sm:grid-cols-2 sm:px-6">
            <div>
              <p className="m-0 text-[11px] font-medium text-zinc-400">
                Início do período
              </p>
              <p className="mb-0 mt-1.5 text-sm font-medium text-zinc-700">
                {date(subscription.currentPeriodStart)}
              </p>
            </div>
            <div>
              <p className="m-0 text-[11px] font-medium text-zinc-400">
                {subscription.cancelAtPeriodEnd
                  ? "Acesso disponível até"
                  : "Fim do período atual"}
              </p>
              <p className="mb-0 mt-1.5 text-sm font-medium text-zinc-700">
                {date(subscription.paidUntil)}
              </p>
            </div>
          </div>
          {subscription.cancelAtPeriodEnd && (
            <p className="m-0 border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs leading-relaxed text-amber-800 sm:px-6">
              O cancelamento está programado para o fim do período. Você mantém
              o acesso até a data acima.
            </p>
          )}
        </section>
        <section
          aria-labelledby="plan-features-title"
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
        >
          <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
            <h2
              id="plan-features-title"
              className="m-0 text-sm font-semibold text-zinc-800"
            >
              O que está incluído
            </h2>
            <p className="mb-0 mt-1 text-xs text-zinc-500">
              Recursos disponíveis no seu plano.
            </p>
          </div>
          <div className="grid gap-6 px-5 py-5 sm:grid-cols-2 sm:px-6">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-3">
                <Icon
                  size={18}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-zinc-400"
                />
                <div>
                  <h3 className="m-0 text-sm font-semibold text-zinc-700">
                    {title}
                  </h3>
                  <p className="mb-0 mt-1 text-xs leading-relaxed text-zinc-500">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-100 px-5 py-4 text-xs text-zinc-500 sm:px-6">
            {[
              "Aprovação automática ou manual",
              features.reports
                ? "4 templates para sua página"
                : "2 templates para sua página",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <Check
                  size={13}
                  aria-hidden="true"
                  className="text-[#635BFF]"
                />
                {item}
              </span>
            ))}
          </div>
        </section>
      </div>
      <aside className="min-w-0 space-y-5">
        <section
          aria-labelledby="plan-usage-title"
          className="rounded-2xl border border-zinc-200 bg-white"
        >
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2
              id="plan-usage-title"
              className="m-0 text-sm font-semibold text-zinc-800"
            >
              Uso do plano
            </h2>
            <p className="mb-0 mt-1 text-xs text-zinc-500">
              Acompanhe os limites da sua conta.
            </p>
          </div>
          <div className="space-y-5 p-5">
            <Usage
              label="Estabelecimentos"
              count={businesses.length}
              limit={features.establishments}
            />
            {businesses.length > 0 && (
              <div className="space-y-4 border-t border-zinc-100 pt-5">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Profissionais por estabelecimento
                </p>
                {businesses.map((b) => (
                  <div key={b.id} className="space-y-2">
                    <Link
                      href={panelHref("/painel/profissionais", b.id)}
                      className="inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-[#635BFF]"
                    >
                      <span className="truncate">{b.name}</span>
                      <ArrowUpRight
                        size={12}
                        aria-hidden="true"
                        className="shrink-0"
                      />
                    </Link>
                    <Usage
                      label="Profissionais"
                      count={b.professionals}
                      limit={features.professionals}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="m-0 text-sm font-semibold text-zinc-800">
            Seu negócio está crescendo?
          </p>
          <p className="mb-4 mt-2 text-xs leading-relaxed text-zinc-500">
            Compare os planos e encontre o espaço que sua equipe precisa.
          </p>
          <Link href="/#planos" className="button w-full justify-center">
            Comparar planos
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </aside>
    </div>
  );
}
