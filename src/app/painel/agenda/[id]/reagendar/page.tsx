import { notFound } from "next/navigation";
import { panelContext } from "@/lib/panel-context";
import { prisma } from "@/lib/prisma";
import { panelHref, type SearchInput } from "@/lib/url-state";
import { RescheduleForm } from "@/components/reschedule-form";
import { PageHeading } from "@/components/internal/primitives";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Alterar atendimento",
  "Atualize a data ou o profissional de um atendimento.",
  "/painel/agenda",
  true,
);
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: SearchInput;
  params: Promise<{ id: string }>;
}) {
  const { business } = await panelContext(searchParams);
  const { id } = await params;
  if (!business) notFound();
  const b = await prisma().booking.findFirst({
    where: { id, purpose: "normal", session: { establishmentId: business.id } },
    include: { session: { include: { service: true, professional: true } } },
  });
  if (!b) notFound();
  return (
    <>
      <PageHeading
        eyebrow={business.name}
        title="Ajuste este atendimento."
        description={`${b.session.service.name} · Apenas esta ocorrência será alterada.`}
      />
      <section className="w-full">
        {b.status === "confirmed" && b.session.startsAt > new Date() ? (
          <RescheduleForm
            bookingId={b.id}
            professionalId={b.session.professionalId}
            timezone={business.timezone}
            original={`${b.session.startsAt.toLocaleString("pt-BR", { timeZone: business.timezone })} com ${b.session.professional.name}`}
            returnTo={panelHref("/painel/agenda", business.id)}
            details={{
              businessName: business.name,
              serviceName: b.session.service.name,
              durationMinutes: b.session.service.durationMinutes,
              priceCents: b.session.service.priceCents,
            }}
          />
        ) : (
          <p>Somente atendimentos confirmados e futuros podem ser alterados.</p>
        )}
      </section>
    </>
  );
}
