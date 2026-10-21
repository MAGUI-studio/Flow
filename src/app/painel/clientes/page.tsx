import { pageMetadata } from "@/lib/seo";
import { panelContext } from "@/lib/panel-context";
import { prisma } from "@/lib/prisma";
import { customerDirectory } from "@/lib/customers";
import { panelHref, type SearchInput } from "@/lib/url-state";
import Link from "next/link";
import { CustomerFilters } from "@/components/internal/customer-filters";
import { PageHeading } from "@/components/internal/primitives";
export const metadata = pageMetadata(
  "Clientes",
  "Histórico e acompanhamento dos clientes do estabelecimento.",
  "/painel/clientes",
  true,
);
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  const { business } = await panelContext(searchParams);
  if (!business)
    return <p>Cadastre um estabelecimento para acompanhar seus clientes.</p>;
  const raw = await searchParams;
  const search =
    typeof raw.busca === "string" ? raw.busca.toLocaleLowerCase("pt-BR") : "";
  const customers = await customerDirectory(prisma(), business.id);
  const bookings = await prisma().booking.findMany({
    where: { session: { establishmentId: business.id }, purpose: "normal" },
    select: {
      consumerId: true,
      status: true,
      session: { select: { startsAt: true } },
    },
  });
  const filtered = customers.filter(
    (c) =>
      `${c.name} ${c.email}`.toLocaleLowerCase("pt-BR").includes(search) &&
      (raw.filtro === "upcoming"
        ? bookings.some(
            (b) =>
              b.consumerId === c.id &&
              b.status === "confirmed" &&
              b.session.startsAt > new Date(),
          )
        : ["canceled", "no_show"].includes(String(raw.filtro))
          ? bookings.some(
              (b) => b.consumerId === c.id && b.status === raw.filtro,
            )
          : true),
  );
  return (
    <>
      <PageHeading
        eyebrow={business.name}
        title="Cada cliente, uma história."
        description="Consulte atendimentos e mantenha observações privadas para acolher melhor quem volta."
      />
      <CustomerFilters />
      <p className="mb-4 text-xs text-zinc-500">{filtered.length} clientes</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const rows = bookings.filter((b) => b.consumerId === c.id);
          return (
            <Link
              key={c.id}
              href={panelHref(
                `/painel/clientes/${encodeURIComponent(c.id)}`,
                business.id,
              )}
              className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-[#635BFF]/50"
            >
              <h2>{c.name}</h2>
              <p className="break-all text-xs text-zinc-500">{c.email}</p>
              <p className="text-xs text-zinc-500">
                {rows.filter((b) => b.status === "completed").length}{" "}
                atendimentos concluídos ·{" "}
                {rows.filter((b) => b.status === "no_show").length} faltas
              </p>
              <span className="block text-xs font-medium text-[#635BFF]">
                Ver histórico →
              </span>
            </Link>
          );
        })}
      </div>
      {!filtered.length && (
        <p className="text-sm text-zinc-500">
          Nenhum cliente encontrado. Os clientes aparecem aqui após o primeiro
          agendamento.
        </p>
      )}
    </>
  );
}
