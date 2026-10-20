import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  ChartNoAxesCombined,
  Users,
  Sparkles,
} from "lucide-react";
import { planFeatures } from "@/lib/plan-features";
export function ProUpgradeCard({ professionals }: { professionals: number }) {
  const essential = planFeatures("basic"),
    pro = planFeatures("multi");
  const nearLimit = professionals >= essential.professionals - 2;
  return (
    <section
      aria-labelledby="pro-upgrade-title"
      className="relative isolate mt-5 overflow-hidden rounded-2xl border border-[#e2def4] bg-white"
    >
      <Sparkles
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 -z-10 size-64 -rotate-12 text-[#635BFF] opacity-[0.04]"
      />
      <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F5F4FF] px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[#635BFF]">
            <Sparkles size={12} aria-hidden="true" />
            FLOW PRO
          </span>
          <h2
            id="pro-upgrade-title"
            className="mb-2 mt-3 text-2xl font-semibold tracking-tight text-zinc-900"
          >
            {nearLimit
              ? "Mais espaço para quem faz seu negócio crescer."
              : "Você organiza a agenda. Agora, enxergue as oportunidades."}
          </h2>
          <p className="m-0 text-sm leading-relaxed text-zinc-500">
            {nearLimit
              ? `Sua equipe já ocupa ${professionals} das ${essential.professionals} vagas do Essencial. Com o PRO, você tem espaço para até ${pro.professionals} profissionais por estabelecimento.`
              : "Veja quais serviços são mais agendados, acompanhe os resultados da equipe e leve essas informações para suas próximas decisões."}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <Link
            href="/#planos"
            className="button w-full justify-center sm:w-auto"
          >
            Conhecer o Flow PRO
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <span className="text-[11px] text-zinc-400">
            Compare os recursos antes de escolher.
          </span>
        </div>
      </div>
      <div className="grid border-t border-zinc-100 sm:grid-cols-3">
        {[
          {
            icon: ChartNoAxesCombined,
            title: "Decisões com mais clareza",
            description:
              "Relatórios por serviço e profissional, com exportação CSV.",
          },
          {
            icon: Users,
            title: "O dobro de espaço na equipe",
            description: `De ${essential.professionals} para ${pro.professionals} profissionais por estabelecimento.`,
          },
          {
            icon: Building2,
            title: "Seu próximo endereço também cabe",
            description: `De ${essential.establishments} para até ${pro.establishments} estabelecimentos na mesma conta.`,
          },
        ].map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex gap-3 border-b border-zinc-100 px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6"
          >
            <Icon
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[#635BFF]"
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
    </section>
  );
}
