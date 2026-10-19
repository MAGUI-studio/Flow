"use client";
import { Fragment, useTransition } from "react";
import Link from "next/link";
import { Tooltip } from "@/components/ui/tooltip";
import { useQueryStates, useQueryState, parseAsString } from "nuqs";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Clock,
  Pencil,
  Scissors,
} from "lucide-react";
import { panelHref, panelSearch } from "@/lib/url-state";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/statusBadge";
import { dayKey, money } from "@/lib/format";
type Professional = {
  id: string;
  name: string;
  active: boolean;
  photo: { url: string } | null;
  vacationStartsAt: Date | null;
  vacationEndsAt: Date | null;
  services: {
    serviceId: string;
    service: {
      name: string;
      durationMinutes: number;
      priceCents: number;
      modality: string;
      kind: string;
    };
  }[];
};
export function ProfessionalsTable({
  rows,
  establishmentId,
  timezone,
  now,
}: {
  rows: Professional[];
  establishmentId: string;
  timezone: string;
  now: string;
}) {
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useQueryStates(panelSearch, {
    shallow: false,
    scroll: false,
    history: "replace",
    startTransition,
  });
  const [expanded, setExpanded] = useQueryState(
    "servicos-profissional",
    parseAsString.withOptions({ shallow: true, scroll: false }),
  );
  const nameSort = query.ordem.startsWith("name"),
    servicesSort = query.ordem.startsWith("services");
  function sort(field: "name" | "services") {
    const next =
      field === "name"
        ? query.ordem === "name_asc"
          ? "name_desc"
          : "name_asc"
        : query.ordem === "services_desc"
          ? "services_asc"
          : "services_desc";
    void setQuery({ ordem: next });
  }
  function SortIcon({ active }: { active: boolean }) {
    return active ? (
      query.ordem.endsWith("asc") ? (
        <ArrowUp size={13} />
      ) : (
        <ArrowDown size={13} />
      )
    ) : (
      <ArrowUpDown size={13} className="text-zinc-300" />
    );
  }
  const formatDate = (date: Date) =>
    dayKey(date, timezone).split("-").reverse().join("/");
  return (
    <DataTable
      title="Sua equipe"
      description="Consulte os serviços vinculados a cada profissional."
      count={rows.length}
      label="Profissionais do estabelecimento"
      pending={pending}
      footer={`${rows.length} ${rows.length === 1 ? "profissional exibido" : "profissionais exibidos"}`}
      columns={
        <>
          <th
            scope="col"
            aria-sort={
              nameSort
                ? query.ordem === "name_asc"
                  ? "ascending"
                  : "descending"
                : "none"
            }
            className="px-5 py-3.5"
          >
            <button
              type="button"
              onClick={() => sort("name")}
              className="inline-flex items-center gap-2 uppercase transition-colors hover:text-zinc-600"
            >
              Profissional
              <SortIcon active={nameSort} />
            </button>
          </th>
          <th
            scope="col"
            aria-sort={
              servicesSort
                ? query.ordem === "services_asc"
                  ? "ascending"
                  : "descending"
                : "none"
            }
            className="px-5 py-3.5"
          >
            <button
              type="button"
              onClick={() => sort("services")}
              className="inline-flex items-center gap-2 uppercase transition-colors hover:text-zinc-600"
            >
              Serviços vinculados
              <SortIcon active={servicesSort} />
            </button>
          </th>
          <th scope="col" className="px-5 py-3.5">
            Período de férias
          </th>
          <th scope="col" className="px-5 py-3.5">
            Status
          </th>
          <th scope="col" className="px-5 py-3.5 text-right">
            Ações
          </th>
        </>
      }
    >
      {rows.map((p) => {
        const vacation =
          p.active && !!p.vacationEndsAt && p.vacationEndsAt > new Date(now);
        const scheduled =
          vacation &&
          !!p.vacationStartsAt &&
          p.vacationStartsAt > new Date(now);
        const status = !p.active
          ? "inactive"
          : vacation
            ? scheduled
              ? "scheduled_vacation"
              : "vacation"
            : "active";
        const open = expanded === p.id;
        return (
          <Fragment key={p.id}>
            <tr
              tabIndex={0}
              aria-expanded={open}
              aria-controls={`professional-services-${p.id}`}
              onClick={(event) => {
                if (
                  (event.target as HTMLElement).closest(
                    "a, button, input, select, textarea",
                  )
                )
                  return;
                void setExpanded(open ? null : p.id);
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void setExpanded(open ? null : p.id);
                }
              }}
              className={`cursor-pointer transition-colors [&>td]:py-2! hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#635BFF] ${open ? "bg-zinc-50" : "bg-white"}`}
            >
              <th scope="row" className="relative p-0! font-normal">
                <div className="flex min-h-16 items-center gap-4 pr-5">
                  <div className="grid size-16 shrink-0 place-items-center overflow-hidden bg-zinc-100 text-base font-semibold text-zinc-600">
                    {p.photo?.url ? (
                      <img
                        src={p.photo.url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      p.name
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join("")
                        .toLocaleUpperCase("pt-BR")
                    )}
                  </div>
                  <div className="max-w-64">
                    <span className="block break-words text-sm font-semibold text-zinc-800">
                      {p.name}
                    </span>
                  </div>
                </div>
              </th>
              <td className="px-5 py-4">
                {p.services.length ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`professional-services-${p.id}`}
                    onClick={() => void setExpanded(open ? null : p.id)}
                    className="flex min-h-8 items-center gap-3 rounded-xl px-2.5 py-0.5 text-left focus-visible:outline-2 focus-visible:outline-[#635BFF]"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-xs font-semibold tabular-nums text-zinc-600">
                      {p.services.length}
                    </span>
                    <span className="max-w-44 truncate text-xs text-zinc-500">
                      {p.services[0].service.name}
                      {p.services.length > 1
                        ? ` +${p.services.length - 1}`
                        : ""}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      size={14}
                      className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : (
                  <span className="text-xs text-zinc-400">
                    Nenhum serviço vinculado
                  </span>
                )}
              </td>
              <td className="px-5 py-4 text-xs text-zinc-500">
                {vacation && p.vacationStartsAt && p.vacationEndsAt ? (
                  <div className="whitespace-nowrap leading-4">
                    <span>{formatDate(p.vacationStartsAt)}</span>
                    <span className="text-zinc-400">
                      {" "}
                      até {formatDate(new Date(p.vacationEndsAt.getTime() - 1))}
                    </span>
                  </div>
                ) : (
                  <span className="text-zinc-300">—</span>
                )}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={status} />
              </td>
              <td className="px-5 py-4 text-right">
                <Tooltip text={`Editar profissional ${p.name}`}>
                  <Link
                    href={panelHref(
                      `/painel/profissionais/${p.id}/editar`,
                      establishmentId,
                    )}
                    aria-label={`Editar profissional ${p.name}`}
                    title={`Editar profissional ${p.name}`}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF]"
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </Link>
                </Tooltip>
              </td>
            </tr>
            {open && (
              <tr id={`professional-services-${p.id}`}>
                <td colSpan={5} className="bg-zinc-50 px-5 py-5">
                  <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
                    <Scissors size={14} className="text-zinc-600" />
                    Serviços de {p.name}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {!p.services.length && (
                      <p className="m-0 text-xs text-zinc-500">
                        Nenhum serviço vinculado a este profissional.
                      </p>
                    )}
                    {p.services.map((link) => (
                      <div
                        key={link.serviceId}
                        className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
                      >
                        <div className="flex items-start justify-between gap-4 px-4 py-3">
                          <span className="min-w-0 break-words text-sm font-semibold leading-snug text-zinc-800">
                            {link.service.name}
                          </span>
                          <span className="shrink-0 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold tabular-nums text-zinc-600">
                            {link.service.priceCents === 0
                              ? "Gratuito"
                              : money(link.service.priceCents)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-zinc-100 px-4 py-2.5 text-[11px] text-zinc-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} aria-hidden="true" />
                            {link.service.durationMinutes} min
                          </span>
                          <span>
                            {link.service.modality === "online"
                              ? "Online"
                              : "Presencial"}
                          </span>
                          <span>
                            {link.service.kind === "collective"
                              ? "Em grupo"
                              : "Individual"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </DataTable>
  );
}
