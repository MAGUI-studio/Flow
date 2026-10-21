import { pageMetadata } from "@/lib/seo";
import { panelContext } from "@/lib/panel-context";
import { prisma } from "@/lib/prisma";
import { customerDirectory } from "@/lib/customers";
import type { SearchInput } from "@/lib/url-state";
import { notFound } from "next/navigation";
import { CustomerNoteForm } from "@/components/internal/scheduling-forms";
import { PageHeading, StatusPill } from "@/components/internal/primitives";
import { money, statusLabel } from "@/lib/format";
export const metadata = pageMetadata(
  "Histórico do cliente",
  "Atendimentos e observações privadas do cliente.",
  "/painel/clientes",
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
  const customer = (await customerDirectory(prisma(), business.id)).find(
    (c) => c.id === id,
  );
  if (!customer) notFound();
  const [bookings, notes] = await Promise.all([
    prisma().booking.findMany({
      where: {
        consumerId: id,
        purpose: "normal",
        session: { establishmentId: business.id },
      },
      include: { session: { include: { service: true, professional: true } } },
      orderBy: { session: { startsAt: "desc" } },
    }),
    prisma().customerNote.findMany({
      where: { consumerId: id, establishmentId: business.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return (
    <>
      <PageHeading
        eyebrow={business.name}
        title={customer.name}
        description={
          customer.email ||
          "Histórico de relacionamento com seu estabelecimento."
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="space-y-4">
          <h2>Atendimentos e reservas</h2>
          {bookings.map((b) => (
            <article
              key={b.id}
              className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{b.session.service.name}</h3>
                <StatusPill status={b.status} label={statusLabel[b.status]} />
              </div>
              <p className="text-xs text-zinc-500">
                {b.session.startsAt.toLocaleString("pt-BR", {
                  timeZone: business.timezone,
                })}{" "}
                · {b.session.professional.name} · {money(b.priceCents)}
              </p>
              {b.whatsapp && (
                <p className="text-xs text-zinc-500">WhatsApp: {b.whatsapp}</p>
              )}
            </article>
          ))}
        </section>
        <section className="space-y-4">
          <h2>Observações privadas</h2>
          <p className="text-xs text-zinc-500">
            Visíveis somente para a conta que gerencia este estabelecimento.
          </p>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <CustomerNoteForm establishmentId={business.id} consumerId={id} />
          </div>
          {notes.map((n) => (
            <div
              key={n.id}
              className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <p className="text-[11px] text-zinc-400">
                Criada em{" "}
                {n.createdAt.toLocaleString("pt-BR", {
                  timeZone: business.timezone,
                })}{" "}
                · Atualizada em{" "}
                {n.updatedAt.toLocaleString("pt-BR", {
                  timeZone: business.timezone,
                })}
              </p>
              <CustomerNoteForm
                establishmentId={business.id}
                consumerId={id}
                note={n}
              />
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
