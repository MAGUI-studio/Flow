import { pageMetadata } from "@/lib/seo";
import { panelContext } from "@/lib/panel-context";
import { prisma } from "@/lib/prisma";
import type { SearchInput } from "@/lib/url-state";
import { PageHeading } from "@/components/internal/primitives";
import { WorkflowButton } from "@/components/internal/scheduling-forms";
export const metadata = pageMetadata(
  "Solicitações de reagendamento",
  "Analise mudanças de horário solicitadas pelos clientes.",
  "/painel/reagendamentos",
  true,
);
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  const { business } = await panelContext(searchParams);
  if (!business) return <p>Cadastre um estabelecimento para começar.</p>;
  const bookings = await prisma().booking.findMany({
    where: { purpose: "reschedule", session: { establishmentId: business.id } },
    include: { session: { include: { service: true, professional: true } } },
  });
  const requests = await prisma().rescheduleRequest.findMany({
    where: {
      targetBookingId: { in: bookings.map((b) => b.id) },
      status: "pending",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "asc" },
  });
  const originals = await prisma().booking.findMany({
    where: { id: { in: requests.map((r) => r.bookingId) } },
    include: { session: { include: { professional: true } } },
  });
  return (
    <>
      <PageHeading
        eyebrow={business.name}
        title="Um novo momento, com sua aprovação."
        description="O atendimento original só é liberado quando você aprovar a mudança."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {requests.map((r) => {
          const next = bookings.find((b) => b.id === r.targetBookingId)!;
          const old = originals.find((b) => b.id === r.bookingId)!;
          return (
            <article
              key={r.id}
              className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <h2>{next.session.service.name}</h2>
              <p className="text-sm text-zinc-600">
                Atual:{" "}
                {old.session.startsAt.toLocaleString("pt-BR", {
                  timeZone: business.timezone,
                })}{" "}
                · {old.session.professional.name}
              </p>
              <p className="text-sm text-zinc-600">
                Solicitado:{" "}
                {next.session.startsAt.toLocaleString("pt-BR", {
                  timeZone: business.timezone,
                })}{" "}
                · {next.session.professional.name}
              </p>
              <p className="text-xs text-zinc-500">
                Responda até{" "}
                {r.expiresAt.toLocaleString("pt-BR", {
                  timeZone: business.timezone,
                })}
              </p>
              <div className="flex flex-wrap gap-3">
                <WorkflowButton
                  action="rescheduleDecision"
                  payload={{ id: r.id, approve: true }}
                  confirm="Aprovar a mudança e liberar o horário original?"
                >
                  Aprovar mudança
                </WorkflowButton>
                <WorkflowButton
                  action="rescheduleDecision"
                  payload={{ id: r.id, approve: false }}
                  confirm="Recusar a mudança e manter o atendimento original?"
                >
                  Manter horário original
                </WorkflowButton>
              </div>
            </article>
          );
        })}
      </div>
      {!requests.length && (
        <p className="text-sm text-zinc-500">
          Nenhuma solicitação aguardando aprovação.
        </p>
      )}
    </>
  );
}
