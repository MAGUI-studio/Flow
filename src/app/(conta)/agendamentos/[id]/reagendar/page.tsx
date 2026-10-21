import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/internal/primitives";
import { RescheduleForm } from "@/components/reschedule-form";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Reagendar atendimento",
  "Escolha uma nova data, horário ou profissional.",
  "/agendamentos",
  true,
);
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth.protect();
  const { id } = await params;
  const b = await prisma().booking.findFirst({
    where: { id, consumerId: userId },
    include: {
      session: {
        include: { establishment: true, service: true, professional: true },
      },
    },
  });
  if (!b) notFound();
  const s = b.session;
  const eligible =
    b.status === "confirmed" &&
    s.startsAt.getTime() - Date.now() >=
      s.establishment.cancelNoticeHours * 3600000 &&
    !(await prisma().rescheduleRequest.count({
      where: {
        bookingId: b.id,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    }));
  return (
    <>
      <PageHeading
        title="Um novo horário para você."
        description={`${s.service.name} · ${s.establishment.name}`}
      />
      <section className="w-full">
        {eligible ? (
          <RescheduleForm
            bookingId={id}
            professionalId={s.professionalId}
            timezone={s.establishment.timezone}
            original={`${s.startsAt.toLocaleString("pt-BR", { timeZone: s.establishment.timezone })} com ${s.professional.name}`}
            details={{
              businessName: s.establishment.name,
              serviceName: s.service.name,
              durationMinutes: s.service.durationMinutes,
              priceCents: s.service.priceCents,
            }}
          />
        ) : (
          <p className="text-sm text-zinc-500">
            Este atendimento não pode ser reagendado agora. Verifique se há uma
            solicitação pendente ou entre em contato com o estabelecimento.
          </p>
        )}
      </section>
    </>
  );
}
