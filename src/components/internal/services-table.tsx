"use client";
import { useTransition } from "react";
import { useQueryStates } from "nuqs";
import Link from "next/link";
import { Tooltip } from "@/components/ui/tooltip";
import { panelHref, panelSearch } from "@/lib/url-state";
import {
  Clock,
  Globe,
  MapPin,
  Pencil,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { money } from "@/lib/format";
type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  modality: string;
  kind: string;
  professionals: { professional: { name: string } }[];
};
export function ServicesTable({
  rows,
  establishmentId,
}: {
  rows: Service[];
  establishmentId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useQueryStates(panelSearch, {
    shallow: false,
    scroll: false,
    history: "replace",
    startTransition,
  });
  function heading(field: "name" | "duration" | "price", label: string) {
    const active = query.ordemServico.startsWith(field);
    const ascending = query.ordemServico.endsWith("asc");
    const Icon = active ? (ascending ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th
        scope="col"
        className={field === "price" ? "text-right" : undefined}
        aria-sort={active ? (ascending ? "ascending" : "descending") : "none"}
      >
        <button
          type="button"
          onClick={() =>
            void setQuery({
              ordemServico: panelSearch.ordemServico.parse(
                field + (active && ascending ? "_desc" : "_asc"),
              ),
            })
          }
          className="inline-flex items-center gap-2 uppercase transition-colors hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-[#635BFF]"
        >
          {label}
          <Icon size={13} aria-hidden="true" />
        </button>
      </th>
    );
  }
  return (
    <DataTable
      title="Seus serviços"
      pending={pending}
      description="Duração, valores e profissionais de cada atendimento."
      count={rows.length}
      label="Serviços do estabelecimento"
      className="whitespace-nowrap"
      footer={`${rows.length} ${rows.length === 1 ? "serviço exibido" : "serviços exibidos"}`}
      columns={
        <>
          {heading("name", "Serviço")}
          {heading("duration", "Duração")}
          <th scope="col">Modalidade</th>
          <th scope="col">Profissionais</th>
          {heading("price", "Valor")}
          <th scope="col" className="text-right">
            Ações
          </th>
        </>
      }
    >
      {rows.map((service) => {
        const ModalityIcon = service.modality === "online" ? Globe : MapPin;
        return (
          <tr key={service.id}>
            <th scope="row" className="font-normal">
              <div className="flex items-center gap-3">
                <div>
                  <span className="block text-sm font-semibold text-zinc-800">
                    {service.name}
                  </span>
                  <span className="mt-1 block text-[11px] text-zinc-400">
                    {service.kind === "collective" ? "Em grupo" : "Individual"}
                  </span>
                </div>
              </div>
            </th>
            <td>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-zinc-500">
                <Clock size={13} aria-hidden="true" />
                {service.durationMinutes} min
              </span>
            </td>
            <td>
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                <ModalityIcon size={13} aria-hidden="true" />
                {service.modality === "online" ? "Online" : "Presencial"}
              </span>
            </td>
            <td>
              <div className="flex flex-nowrap items-center gap-1.5">
                {service.professionals.length ? (
                  service.professionals.map((link, index) => (
                    <span
                      key={index}
                      className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-600"
                    >
                      {link.professional.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400">
                    Nenhum profissional vinculado
                  </span>
                )}
              </div>
            </td>
            <td className="text-right">
              <strong className="whitespace-nowrap text-sm font-semibold text-zinc-600">
                {service.priceCents === 0
                  ? "Gratuito"
                  : money(service.priceCents)}
              </strong>
              <span className="mt-1 block text-[11px] text-zinc-400">
                por atendimento
              </span>
            </td>
            <td className="text-right">
              <Tooltip text={`Editar serviço ${service.name}`}>
                <Link
                  href={panelHref(
                    `/painel/servicos/${service.id}/editar`,
                    establishmentId,
                  )}
                  aria-label={`Editar serviço ${service.name}`}
                  title={`Editar serviço ${service.name}`}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF]"
                >
                  <Pencil size={14} aria-hidden="true" />
                </Link>
              </Tooltip>
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
