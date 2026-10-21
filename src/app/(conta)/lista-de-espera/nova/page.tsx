import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { PageHeading } from "@/components/internal/primitives";
import { WaitlistForm } from "@/components/waitlist-form";
import { dayKey } from "@/lib/format";
export const metadata = pageMetadata(
  "Entrar na lista de espera",
  "Receba um aviso quando surgir um horário que combine com você.",
  "/lista-de-espera",
  true,
);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string; profissional?: string }>;
}) {
  const { userId } = await auth.protect();
  const query = await searchParams;
  const s = query.servico
    ? await prisma().service.findFirst({
        where: {
          id: query.servico,
          active: true,
          establishment: { active: true, published: true },
        },
        include: {
          establishment: true,
          professionals: { include: { professional: true } },
        },
      })
    : null;
  if (!s || s.establishment.ownerId === userId) notFound();
  const professionals = s.professionals
    .filter((p) => p.professional.active && !p.professional.deletedAt)
    .map((p) => ({ id: p.professionalId, name: p.professional.name }));
  return (
    <>
      <PageHeading
        title="Seu próximo horário pode aparecer."
        description={`${s.name} · ${s.establishment.name}`}
      />
      <section className="max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
        <WaitlistForm
          serviceId={s.id}
          professionalId={
            professionals.some((p) => p.id === query.profissional)
              ? query.profissional
              : ""
          }
          professionals={professionals}
          today={dayKey(new Date(), s.establishment.timezone)}
          horizon={dayKey(
            new Date(Date.now() + 90 * 86400000),
            s.establishment.timezone,
          )}
        />
      </section>
    </>
  );
}
