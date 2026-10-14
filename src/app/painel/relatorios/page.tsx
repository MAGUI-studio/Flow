import {
  Download,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ChartNoAxesCombined,
} from "lucide-react";
import { panelContext } from "@/lib/panel-context";
import type { SearchInput } from "@/lib/url-state";
import { reportRows } from "@/lib/reports";
import { summarizeReport, reportDays } from "@/lib/report-utils";
import { money, statusLabel } from "@/lib/format";
import { PageHeading, EmptyState } from "@/components/internal/primitives";
import { ReportPeriod } from "@/components/internal/report-period";
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  const context = await panelContext(searchParams);
  if (context.subscription.plan !== "multi")
    return (
      <>
        <PageHeading
          title="Um olhar mais completo sobre seu negócio."
          description="Compare serviços, acompanhe a equipe e exporte o histórico da sua agenda."
        />
        <EmptyState
          title="Relatórios avançados no Pro"
          description="Tenha relatórios por serviço e profissional, distribuição de status e exportação de agendamentos em CSV."
          href="/#planos"
          label="Conhecer o Pro"
          icon={<ChartNoAxesCombined size={26} />}
        />
      </>
    );
  const days = reportDays((await searchParams).dias);
  const rows = await reportRows(
    context.userId,
    context.business?.id ?? null,
    days,
  );
  const report = summarizeReport(rows);
  const exportQuery = new URLSearchParams({
    dias: String(days),
    ...(context.business ? { estabelecimento: context.business.id } : {}),
  });
  return (
    <>
      <PageHeading
        eyebrow="FLOW PRO"
        title="Sua agenda em perspectiva."
        description={`Atendimentos iniciados nos últimos ${days} dias${context.business ? ` em ${context.business.name}` : ""}.`}
        action={
          <a
            href={`/api/reports/export?${exportQuery}`}
            download
            className="button"
          >
            <Download size={16} />
            Exportar CSV
          </a>
        }
      />
      <div className="mb-7 max-w-56">
        <ReportPeriod />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Agendamentos",
            value: String(report.total),
            icon: CalendarDays,
          },
          {
            label: "Concluídos",
            value: String(report.completed),
            icon: CheckCircle2,
          },
          {
            label: "Cancelados, recusados ou expirados",
            value: String(report.canceled),
            icon: CalendarDays,
          },
          {
            label: "Valor dos serviços concluídos",
            value: money(report.completedValue),
            icon: CircleDollarSign,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="relative isolate overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6"
          >
            <metric.icon
              aria-hidden="true"
              className="absolute -right-3 -bottom-4 -z-10 size-28 rotate-[-12deg] stroke-1 text-[#635BFF]/8"
            />
            <span className="text-xs text-zinc-500">{metric.label}</span>
            <strong className="mt-4 block text-3xl font-semibold tracking-tight">
              {metric.value}
            </strong>
          </div>
        ))}
      </div>
      <p className="my-5 text-xs leading-relaxed text-zinc-500">
        Os valores refletem os preços registrados nos agendamentos, não
        pagamentos recebidos. O Flow não processa pagamentos de serviços. Faltas
        registradas no período: {report.noShows}.
      </p>
      {!rows.length ? (
        <EmptyState
          title="Os próximos números começam com um encontro."
          description="Ainda não há agendamentos iniciados neste período. Experimente outro intervalo."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {[
            { title: "Serviços mais agendados", items: report.services },
            {
              title: "Agendamentos por profissional",
              items: report.professionals,
            },
            {
              title: "Distribuição por status",
              items: report.statuses.map((item) => ({
                ...item,
                name: statusLabel[item.name] ?? item.name,
              })),
            },
          ].map((group) => (
            <section
              key={group.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6"
            >
              <h2 className="mb-6 text-base font-semibold">{group.title}</h2>
              <div className="space-y-5">
                {group.items.map((item) => (
                  <div key={item.name}>
                    <div className="mb-2 flex justify-between gap-3 text-xs">
                      <span className="text-zinc-600">{item.name}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#F5F4FF]">
                      <div
                        className="h-full rounded-full bg-[#635BFF]"
                        style={{
                          width: `${(item.count / report.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
