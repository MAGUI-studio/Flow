"use client";
import { notify, useToastError } from "@/components/ui/flow-toaster";
import { AnimatedArrow } from "@/components/ui/animated-arrow";
import { Fragment, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { arrowMotion } from "./ui/arrow-link";
import { authModalAppearance } from "@/lib/auth-modal-appearance";
import {
  subscriptionAuthRedirects,
  type SubscriptionPlan,
} from "@/lib/subscription-flow";
type ComparisonRow = {
  label: string;
  description?: string;
  values?: [string, string];
  proOnly?: boolean;
};
const comparison: { title: string; rows: ComparisonRow[] }[] = [
  {
    title: "Estrutura do seu negócio",
    rows: [
      {
        label: "Estabelecimentos",
        description: "Cada unidade com sua própria página e agenda.",
        values: ["1 estabelecimento", "Até 3 estabelecimentos"],
      },
      {
        label: "Profissionais por estabelecimento",
        values: ["Até 10 profissionais", "Até 20 profissionais"],
      },
      {
        label: "Capacidade total da equipe",
        values: ["Até 10 profissionais", "Até 60 profissionais"],
      },
    ],
  },
  {
    title: "Uma página com a sua identidade",
    rows: [
      {
        label: "Página personalizada",
        description: "Logo, capa, apresentação e informações de contato.",
      },
    ],
  },
  {
    title: "Agendamento e rotina",
    rows: [
      { label: "Serviços individuais e em grupo" },
      { label: "Atendimento presencial e online" },
      { label: "Agenda recorrente e datas específicas" },
      { label: "Aprovação automática ou manual" },
      { label: "Histórico e confirmação de presença" },
    ],
  },
  {
    title: "Gestão e análise",
    rows: [
      {
        label: "Relatórios avançados",
        description: "Indicadores por serviço, profissional e status.",
        proOnly: true,
      },
      {
        label: "Exportação de dados",
        description: "Histórico de agendamentos em CSV.",
        proOnly: true,
      },
    ],
  },
];
export function Plans({
  currentPlan,
  development,
}: {
  currentPlan: string | null;
  development: boolean;
}) {
  const { isSignedIn } = useUser(),
    clerk = useClerk(),
    router = useRouter();
  const setError = useToastError();
  const [busy, setBusy] = useState("");
  async function select(plan: SubscriptionPlan) {
    if (!isSignedIn) {
      await clerk.openSignIn({
        ...subscriptionAuthRedirects(plan),
        appearance: authModalAppearance,
      });
      return;
    }
    if (currentPlan && !development) {
      router.push(`/assinatura/alterar?plano=${plan}`);
      return;
    }
    setBusy(plan);
    setError("");
    try {
      const r = await fetch(
        development ? "/api/subscription/development" : "/api/billing/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        },
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      if (data.url) window.location.assign(data.url);
      else {
        notify.success("Plano ativado", "Seu painel está pronto para você.");
        router.push("/painel");
        router.refresh();
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível ativar o plano.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">
            Comparação dos planos mensais do Flow
          </caption>
          <thead>
            <tr className="border-b border-[#e8e5f6]">
              <th
                scope="col"
                className="w-[38%] pt-5 pr-3 pb-6 align-top font-normal sm:w-[44%] sm:pr-6 sm:pb-8 sm:align-bottom"
              >
                <span className="text-[8px] font-medium tracking-[.12em] text-zinc-400 uppercase sm:text-[10px] sm:tracking-[.18em]">
                  Comparativo
                </span>
                <h3 className="mt-3 text-base font-semibold tracking-tight sm:text-2xl">
                  Recursos por plano
                </h3>
                <p className="mt-3 hidden max-w-64 text-xs leading-relaxed text-zinc-500 sm:block">
                  Compare cada detalhe e encontre o plano que acompanha o seu
                  negócio.
                </p>
                {isSignedIn && !development && (
                  <Link
                    href="/assinatura"
                    className="mt-5 inline-flex text-[10px] leading-relaxed font-medium text-[#635BFF] underline underline-offset-4 sm:text-xs"
                  >
                    Minha assinatura e pagamentos
                  </Link>
                )}
              </th>
              {[
                {
                  id: "basic",
                  name: "Essencial",
                  price: "49,90",
                  description: "Tudo para a sua primeira unidade.",
                  capacity: "1 estabelecimento",
                  label: "Para começar",
                },
                {
                  id: "multi",
                  name: "PRO",
                  price: "89,90",
                  description: "Mais equipe, mais liberdade para crescer.",
                  capacity: "Até 3 estabelecimentos",
                  label: "Para ir além",
                },
              ].map((plan) => (
                <th
                  scope="col"
                  key={plan.id}
                  className={`w-[31%] border-l border-[#e8e5f6] px-1.5 pt-5 pb-6 text-center align-bottom font-normal sm:w-[28%] sm:px-7 sm:pb-8 ${plan.id === "multi" ? "border-t-2 border-t-[#635BFF] bg-[#F5F4FF]/50" : ""}`}
                >
                  <span
                    className={`hidden rounded-full px-3 py-1 text-[9px] font-semibold tracking-[.12em] uppercase sm:inline-flex ${plan.id === "multi" ? "bg-[#635BFF] text-white" : "bg-zinc-100 text-zinc-500"}`}
                  >
                    {plan.label}
                  </span>
                  <h3 className="text-sm font-semibold tracking-tight sm:mt-4 sm:text-2xl">
                    <span className="hidden sm:inline">Flow </span>
                    {plan.name}
                  </h3>
                  <p className="mt-2 hidden min-h-10 text-xs leading-relaxed text-zinc-500 sm:block">
                    {plan.description}
                  </p>
                  <p className="mt-4 text-zinc-900 sm:mt-5 sm:flex sm:flex-wrap sm:items-baseline sm:justify-center sm:gap-x-1">
                    <span className="block text-[9px] font-medium sm:inline sm:text-sm">
                      R$
                    </span>
                    <span className="text-[22px] font-semibold tracking-tight sm:text-4xl">
                      {plan.price}
                    </span>
                    <span className="block text-[9px] font-normal text-zinc-500 sm:inline sm:text-xs">
                      /mês
                    </span>
                  </p>
                  <span className="mt-3 inline-block rounded-lg border border-[#635BFF]/15 bg-[#F5F4FF] px-1.5 py-1 text-[9px] leading-relaxed font-medium text-[#635BFF] sm:rounded-full sm:px-2.5 sm:text-[10px]">
                    7 dias grátis
                    <span className="block text-[8px] sm:inline sm:text-[10px]">
                      {" "}
                      na primeira assinatura
                    </span>
                  </span>
                  <p className="mt-3 min-h-8 text-[9px] leading-relaxed text-zinc-500 sm:min-h-0 sm:text-[11px]">
                    {plan.capacity}
                  </p>
                  {currentPlan === plan.id ? (
                    <Link
                      href="/painel/assinatura"
                      className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-[#635BFF]/30 bg-white px-1 text-[9px] leading-relaxed font-medium text-[#635BFF] transition-colors hover:bg-[#F5F4FF] sm:mt-6 sm:gap-2 sm:rounded-xl sm:px-3 sm:text-xs"
                    >
                      Gerenciar meu plano{" "}
                      <Check size={15} className="hidden shrink-0 sm:block" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => select(plan.id as SubscriptionPlan)}
                      className={`group mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border px-1 text-[9px] leading-relaxed font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF] disabled:opacity-50 sm:mt-6 sm:gap-2 sm:rounded-xl sm:px-3 sm:text-xs ${plan.id === "multi" ? "border-[#635BFF] bg-[#635BFF] text-white hover:bg-[#5046E5]" : "border-zinc-200 bg-white text-zinc-700 hover:border-[#635BFF] hover:text-[#635BFF]"}`}
                    >
                      {busy === plan.id
                        ? "Ativando…"
                        : currentPlan
                          ? "Mudar plano"
                          : "Escolher " + plan.name}
                      <AnimatedArrow
                        size={15}
                        className={`hidden shrink-0 sm:block ${arrowMotion}`}
                      />
                    </button>
                  )}
                  <p className="mt-3 mb-0 hidden text-[10px] leading-relaxed text-zinc-400 sm:block">
                    {currentPlan
                      ? "Altere seu plano com ajuste proporcional."
                      : "Depois do teste, cobrança mensal. Cancele quando quiser."}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.map((group) => (
              <Fragment key={group.title}>
                <tr>
                  <th
                    colSpan={3}
                    scope="colgroup"
                    className="pt-9 pb-4 text-[10px] font-semibold tracking-[.18em] text-[#635BFF] uppercase"
                  >
                    {group.title}
                  </th>
                </tr>
                {group.rows.map((feature) => (
                  <tr
                    key={feature.label}
                    className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/70"
                  >
                    <th
                      scope="row"
                      className="py-4 pr-3 align-middle font-normal sm:py-5 sm:pr-6"
                    >
                      <span className="text-[10px] leading-relaxed font-medium text-zinc-800 sm:text-[13px]">
                        {feature.label}
                      </span>
                      {feature.description && (
                        <span className="mt-1 hidden text-[11px] leading-relaxed text-zinc-400 sm:block">
                          {feature.description}
                        </span>
                      )}
                    </th>
                    {[0, 1].map((index) => (
                      <td
                        key={index}
                        className={`border-l border-[#e8e5f6] px-1.5 py-4 text-center align-middle sm:px-7 sm:py-5 ${index === 1 ? "bg-[#F5F4FF]/35" : ""}`}
                      >
                        {feature.values ? (
                          <span
                            className={`text-[9px] leading-relaxed sm:text-xs ${index === 1 ? "font-semibold text-zinc-800" : "text-zinc-500"}`}
                          >
                            {feature.values[index]}
                          </span>
                        ) : feature.proOnly && index === 0 ? (
                          <span
                            aria-label="Não incluído"
                            className="text-zinc-300"
                          >
                            —
                          </span>
                        ) : feature.proOnly ? (
                          <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#635BFF]/20 bg-[#F5F4FF] px-2.5 py-1 text-[10px] font-medium text-[#635BFF]">
                            <Check size={12} />
                            Exclusivo do Flow PRO
                          </span>
                        ) : (
                          <span className="mx-auto inline-grid size-6 place-items-center rounded-full bg-[#F5F4FF] text-[#635BFF]">
                            <Check aria-hidden size={14} strokeWidth={2.2} />
                            <span className="sr-only">Incluído</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
