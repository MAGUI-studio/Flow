import { pageMetadata } from "@/lib/seo";
import { panelContext } from "@/lib/panel-context";
import { prisma } from "@/lib/prisma";
import type { SearchInput } from "@/lib/url-state";
import {
  BlockForm,
  WorkflowButton,
} from "@/components/internal/scheduling-forms";
import { PageHeading } from "@/components/internal/primitives";
export const metadata = pageMetadata(
  "Bloqueios de agenda",
  "Organize feriados, férias e compromissos da equipe.",
  "/painel/bloqueios",
  true,
);
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  const { business } = await panelContext(searchParams);
  if (!business)
    return <p>Cadastre um estabelecimento para organizar a agenda.</p>;
  const [professionals, blocks] = await Promise.all([
    prisma().professional.findMany({
      where: { establishmentId: business.id, deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma().scheduleBlock.findMany({
      where: { establishmentId: business.id, endsAt: { gt: new Date() } },
      orderBy: { startsAt: "asc" },
    }),
  ]);
  return (
    <>
      <PageHeading
        eyebrow={business.name}
        title="Reserve espaço para as pausas."
        description="Bloqueie períodos sem perder de vista os atendimentos já marcados."
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <h2 className="mb-5">Novo bloqueio</h2>
          <BlockForm
            establishmentId={business.id}
            professionals={professionals}
            timezone={business.timezone}
          />
        </section>
        <section className="space-y-4">
          <h2>Períodos bloqueados</h2>
          {!blocks.length && (
            <p className="text-sm text-zinc-500">Nenhum bloqueio programado.</p>
          )}
          {blocks.map((b) => (
            <article
              key={b.id}
              className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <h3 className="text-sm font-semibold">{b.reason}</h3>
              <p className="text-xs text-zinc-500">
                {b.startsAt.toLocaleString("pt-BR", {
                  timeZone: business.timezone,
                })}{" "}
                até{" "}
                {b.endsAt.toLocaleString("pt-BR", {
                  timeZone: business.timezone,
                })}
              </p>
              <p className="text-xs text-zinc-500">
                {b.professionalIds.length
                  ? professionals
                      .filter((p) => b.professionalIds.includes(p.id))
                      .map((p) => p.name)
                      .join(", ")
                  : "Toda a equipe"}
              </p>
              <WorkflowButton
                action="unblock"
                payload={{ id: b.id }}
                confirm="Remover este bloqueio e disponibilizar novamente os horários?"
              >
                Remover bloqueio
              </WorkflowButton>
            </article>
          ))}
        </section>
      </div>
    </>
  );
}
