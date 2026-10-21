import Link from "next/link";
import { panelHref } from "@/lib/url-state";
import { pageMetadata } from "@/lib/seo";
import { panelContext } from "@/lib/panel-context";
import { prisma } from "@/lib/prisma";
import { customerDirectory } from "@/lib/customers";
import type { SearchInput } from "@/lib/url-state";
import {
  SeriesForm,
  WorkflowButton,
} from "@/components/internal/scheduling-forms";
import { PageHeading, StatusPill } from "@/components/internal/primitives";
import { statusLabel } from "@/lib/format";
export const metadata = pageMetadata(
  "Agendamentos recorrentes",
  "Programe atendimentos semanais ou quinzenais.",
  "/painel/recorrencias",
  true,
);
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  const { business } = await panelContext(searchParams);
  if (!business) return <p>Cadastre um estabelecimento para começar.</p>;
  const [customers, professionals, services, series] = await Promise.all([
    customerDirectory(prisma(), business.id),
    prisma().professional.findMany({
      where: { establishmentId: business.id, active: true, deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma().service.findMany({
      where: { establishmentId: business.id, active: true },
      include: { professionals: true },
    }),
    prisma().bookingSeries.findMany({
      where: { establishmentId: business.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);
  const bookings = await prisma().booking.findMany({
    where: { seriesId: { in: series.map((s) => s.id) } },
    include: { session: true },
    orderBy: { session: { startsAt: "asc" } },
  });
  return (
    <>
      <PageHeading
        eyebrow={business.name}
        title="Cuidados que têm continuidade."
        description="Organize uma sequência de atendimentos e revise cada data antes de confirmar."
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h2 className="mb-5">Nova sequência</h2>
          <SeriesForm
            establishmentId={business.id}
            timezone={business.timezone}
            professionals={professionals}
            services={services.map((s) => ({
              id: s.id,
              name: s.name,
              professionalIds: s.professionals.map((p) => p.professionalId),
            }))}
            customers={customers}
          />
        </section>
        <section className="space-y-4">
          <h2>Sequências de atendimento</h2>
          {!series.length && (
            <p className="text-sm text-zinc-500">Nenhuma sequência criada.</p>
          )}
          {series.map((s) => {
            const rows = bookings.filter((b) => b.seriesId === s.id);
            const next = rows.find(
              (b) =>
                b.session.startsAt > new Date() &&
                ["confirmed", "pending"].includes(b.status),
            );
            return (
              <article
                key={s.id}
                className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5"
              >
                <h3 className="font-semibold">
                  {customers.find((c) => c.id === s.consumerId)?.name ??
                    "Cliente"}{" "}
                  · {services.find((v) => v.id === s.serviceId)?.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  {s.intervalWeeks === 1 ? "Semanal" : "Quinzenal"} ·{" "}
                  {rows.length} atendimentos
                </p>
                <ul className="space-y-3">
                  {rows.map((b) => (
                    <li
                      className="flex flex-wrap items-center justify-between gap-2 text-xs"
                      key={b.id}
                    >
                      <span>
                        {b.session.startsAt.toLocaleString("pt-BR", {
                          timeZone: business.timezone,
                        })}
                      </span>
                      <StatusPill
                        status={b.status}
                        label={statusLabel[b.status]}
                      />
                      {["confirmed", "pending"].includes(b.status) &&
                        b.session.startsAt > new Date() && (
                          <WorkflowButton
                            action="cancelSeries"
                            payload={{ id: s.id, fromBookingId: b.id }}
                            confirm="Cancelar este e todos os próximos atendimentos desta sequência?"
                          >
                            Cancelar a partir daqui
                          </WorkflowButton>
                        )}
                    </li>
                  ))}
                </ul>
                {next && (
                  <Link
                    className="inline-flex text-xs font-medium text-[#635BFF]"
                    href={panelHref(
                      `/painel/recorrencias/${s.id}/editar`,
                      business.id,
                    )}
                  >
                    Alterar próximos atendimentos →
                  </Link>
                )}
                {next && (
                  <p className="text-xs text-zinc-500">
                    Para alterar somente um atendimento, use a agenda. O cliente
                    pode solicitar o reagendamento pela própria conta.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </>
  );
}
