import { notFound } from "next/navigation";
import { panelContext } from "@/lib/panel-context";
import { prisma } from "@/lib/prisma";
import { customerDirectory } from "@/lib/customers";
import { dayKey, hourLabel } from "@/lib/format";
import { phoneMask } from "@/lib/masks";
import type { SearchInput } from "@/lib/url-state";
import { SeriesForm } from "@/components/internal/scheduling-forms";
import { PageHeading } from "@/components/internal/primitives";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Alterar recorrência",
  "Atualize os próximos atendimentos de uma sequência.",
  "/painel/recorrencias",
  true,
);
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchInput;
}) {
  const { business } = await panelContext(searchParams);
  if (!business) notFound();
  const { id } = await params;
  const series = await prisma().bookingSeries.findFirst({
    where: { id, establishmentId: business.id },
  });
  if (!series) notFound();
  const bookings = await prisma().booking.findMany({
    where: {
      seriesId: id,
      status: { in: ["confirmed", "pending"] },
      session: { startsAt: { gt: new Date() } },
    },
    include: { session: true },
    orderBy: { session: { startsAt: "asc" } },
  });
  if (!bookings.length) notFound();
  const first = bookings[0];
  const services = await prisma().service.findMany({
    where: { id: series.serviceId, establishmentId: business.id },
    include: { professionals: true },
  });
  const professionals = await prisma().professional.findMany({
    where: { establishmentId: business.id, active: true, deletedAt: null },
    select: { id: true, name: true },
  });
  const customers = (await customerDirectory(prisma(), business.id)).filter(
    (c) => c.id === series.consumerId,
  );
  return (
    <>
      <PageHeading
        eyebrow={business.name}
        title="Ajuste os próximos encontros."
        description="As datas anteriores ficam no histórico. Os horários atuais só serão liberados se toda a nova sequência puder ser confirmada."
      />
      <section className="max-w-3xl rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
        <SeriesForm
          establishmentId={business.id}
          customers={customers}
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            professionalIds: s.professionals.map((p) => p.professionalId),
          }))}
          professionals={professionals}
          timezone={business.timezone}
          editing={{
            id,
            fromBookingId: first.id,
            initial: {
              consumerId: series.consumerId,
              serviceId: series.serviceId,
              professionalId: series.professionalId,
              fromDate: dayKey(first.session.startsAt, business.timezone),
              time: hourLabel(first.session.startsAt, business.timezone),
              count: Math.max(2, bookings.length),
              intervalWeeks: series.intervalWeeks,
              phone: phoneMask((first.whatsapp ?? "").replace(/^\+55/, "")),
            },
          }}
        />
      </section>
    </>
  );
}
