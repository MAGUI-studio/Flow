import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { PageHeading } from "@/components/internal/primitives";
import { WaitlistAction } from "@/components/waitlist-form";
import { runScheduling } from "@/lib/scheduling-worker";
export const metadata = pageMetadata(
  "Minha lista de espera",
  "Acompanhe suas inscrições e aceite vagas disponíveis.",
  "/lista-de-espera",
  true,
);
export default async function Page() {
  const { userId } = await auth.protect();
  await runScheduling();
  const entries = await prisma().waitlistEntry.findMany({
    where: { consumerId: userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const services = await prisma().service.findMany({
    where: { id: { in: entries.map((e) => e.serviceId) } },
    include: { establishment: true },
  });
  const offers = await prisma().booking.findMany({
    where: {
      id: {
        in: entries.flatMap((e) =>
          e.offeredBookingId ? [e.offeredBookingId] : [],
        ),
      },
    },
    include: { session: { include: { professional: true } } },
  });
  const labels: Record<string, string> = {
    waiting: "Aguardando vaga",
    offered: "Vaga reservada para você",
    booked: "Vaga aceita",
    expired: "Período encerrado",
    canceled: "Inscrição cancelada",
  };
  return (
    <>
      <PageHeading
        title="Sua vez está mais perto."
        description="Acompanhe as vagas que combinam com seus horários. As ofertas ficam disponíveis por até 30 minutos."
      />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {entries.map((entry) => {
          const s = services.find((s) => s.id === entry.serviceId)!;
          const offer = offers.find((b) => b.id === entry.offeredBookingId);
          const valid =
            entry.status === "offered" &&
            entry.offerExpiresAt! > new Date() &&
            offer?.status === "pending";
          return (
            <article
              key={entry.id}
              className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <p className="text-xs font-semibold text-[#635BFF]">
                {labels[entry.status]}
              </p>
              <h2>{s.name}</h2>
              <p className="text-sm text-zinc-500">{s.establishment.name}</p>
              <p className="text-xs text-zinc-500">
                {entry.fromDate.split("-").reverse().join("/")} a{" "}
                {entry.toDate.split("-").reverse().join("/")} · {entry.fromTime}
                –{entry.toTime}
              </p>
              {valid && (
                <div className="space-y-2 rounded-xl bg-[#F5F4FF] p-4 text-sm">
                  <strong>
                    {offer.session.startsAt.toLocaleString("pt-BR", {
                      timeZone: s.establishment.timezone,
                    })}
                  </strong>
                  <p>Com {offer.session.professional.name}</p>
                  <p className="text-xs">
                    Aceite até{" "}
                    {entry.offerExpiresAt!.toLocaleTimeString("pt-BR", {
                      timeZone: s.establishment.timezone,
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    .{" "}
                    {s.establishment.approvalMode === "manual"
                      ? "A confirmação depende da aprovação do estabelecimento."
                      : "Ao aceitar, seu agendamento será confirmado."}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {valid && <WaitlistAction id={entry.id} accept />}
                {["waiting", "offered"].includes(entry.status) && (
                  <WaitlistAction id={entry.id} accept={false} />
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!entries.length && (
        <p className="text-sm text-zinc-500">
          Você ainda não entrou em uma lista de espera. Escolha um serviço na
          página do estabelecimento para informar os horários desejados.
        </p>
      )}
    </>
  );
}
