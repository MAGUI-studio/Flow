"use client";
import { notify, useToastError } from "@/components/ui/flow-toaster";
import { AnimatedArrow } from "@/components/ui/animated-arrow";
import { Fragment, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { arrowMotion } from "./ui/arrow-link";
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
      {
        label: "Templates incluídos",
        values: ["Flow e Essência", "Todos os 4 templates"],
      },
      {
        label: "Templates exclusivos",
        description: "Editorial e Noturno.",
        proOnly: true,
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
  async function select(plan: string) {
    if (!isSignedIn) {
      await clerk.openSignIn({ forceRedirectUrl: window.location.href });
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
      <p className="mb-4 text-center text-[11px] text-zinc-400 sm:hidden">
        Deslize para comparar os planos lado a lado.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
          <caption className="sr-only">
            Comparação dos planos mensais do Flow
          </caption>
          <thead>
            <tr className="border-b border-[#e8e5f6]">
              <th
                scope="col"
                className="w-[44%] pt-5 pr-6 pb-8 align-bottom font-normal"
              >
                <span className="text-[10px] font-medium tracking-[.18em] text-zinc-400 uppercase">
                  Comparativo
                </span>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                  Recursos por plano
                </h3>
                <p className="mt-3 max-w-64 text-xs leading-relaxed text-zinc-500">
                  Compare cada detalhe e encontre o plano que acompanha o seu
                  negócio.
                </p>
              </th>
              {[
                {
                  id: "basic",
                  name: "Essencial",
                  description: "Tudo para a sua primeira unidade.",
                  capacity: "1 estabelecimento",
                  label: "Para começar",
                },
                {
                  id: "multi",
                  name: "Flow PRO",
                  description: "Mais equipe, mais liberdade para crescer.",
                  capacity: "Até 3 estabelecimentos",
                  label: "Para ir além",
                },
              ].map((plan) => (
                <th
                  scope="col"
                  key={plan.id}
                  className={`w-[28%] border-l border-[#e8e5f6] px-5 pt-5 pb-8 text-center align-bottom font-normal sm:px-7 ${plan.id === "multi" ? "border-t-2 border-t-[#635BFF] bg-[#F5F4FF]/50" : ""}`}
                >
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[9px] font-semibold tracking-[.12em] uppercase ${plan.id === "multi" ? "bg-[#635BFF] text-white" : "bg-zinc-100 text-zinc-500"}`}
                  >
                    {plan.label}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                    Flow {plan.name}
                  </h3>
                  <p className="mt-2 min-h-10 text-xs leading-relaxed text-zinc-500">
                    {plan.description}
                  </p>
                  <p className="mt-5 text-base font-semibold text-zinc-800">
                    {plan.capacity}
                  </p>
                  <span className="mt-1 block text-[11px] text-zinc-400">
                    Assinatura mensal
                  </span>
                  {currentPlan === plan.id ? (
                    <Link
                      href="/painel"
                      className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#635BFF]/30 bg-white px-3 text-xs font-medium text-[#635BFF] transition-colors hover:bg-[#F5F4FF]"
                    >
                      Plano ativo <Check size={15} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => select(plan.id)}
                      className={`group mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF] disabled:opacity-50 ${plan.id === "multi" ? "border-[#635BFF] bg-[#635BFF] text-white hover:bg-[#5046E5]" : "border-zinc-200 bg-white text-zinc-700 hover:border-[#635BFF] hover:text-[#635BFF]"}`}
                    >
                      {busy === plan.id
                        ? "Ativando…"
                        : currentPlan
                          ? "Mudar plano"
                          : "Escolher " + plan.name}
                      <AnimatedArrow size={15} className={arrowMotion} />
                    </button>
                  )}
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
                      className="py-5 pr-6 align-middle font-normal"
                    >
                      <span className="text-[13px] font-medium text-zinc-800">
                        {feature.label}
                      </span>
                      {feature.description && (
                        <span className="mt-1 block text-[11px] leading-relaxed text-zinc-400">
                          {feature.description}
                        </span>
                      )}
                    </th>
                    {[0, 1].map((index) => (
                      <td
                        key={index}
                        className={`border-l border-[#e8e5f6] px-5 py-5 text-center align-middle sm:px-7 ${index === 1 ? "bg-[#F5F4FF]/35" : ""}`}
                      >
                        {feature.values ? (
                          <span
                            className={`text-xs leading-relaxed ${index === 1 ? "font-semibold text-zinc-800" : "text-zinc-500"}`}
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
