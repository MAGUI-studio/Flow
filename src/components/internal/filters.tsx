"use client";
import { debounce, useQueryStates } from "nuqs";
import { useTransition } from "react";
import { Search, X, LoaderCircle } from "lucide-react";
import { panelSearch } from "@/lib/url-state";
import { FlowSelect } from "@/components/ui/flow-select";
export function ListFilters({
  placeholder = "Buscar…",
  statuses = false,
  period = false,
  professionals = [],
  preview = false,
}: {
  placeholder?: string;
  statuses?: boolean;
  period?: boolean;
  professionals?: { id: string; name: string }[];
  preview?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [urlQuery, setQuery] = useQueryStates(panelSearch, {
    shallow: false,
    history: "replace",
    scroll: false,
    startTransition,
  });
  const query = preview
    ? {
        ...urlQuery,
        busca: "",
        status: "all",
        profissional: "all",
        periodo: "upcoming",
      }
    : urlQuery;
  const active =
    query.busca || query.status !== "all" || query.profissional !== "all";
  return (
    <div className="internal-filters">
      <div className="internal-search rounded-lg border border-transparent transition-colors focus-within:border-[#635BFF]/40 focus-within:bg-[#F5F4FF]/60 focus-within:ring-2 focus-within:ring-[#635BFF]/10">
        <Search size={17} />
        <input
          className="focus-visible:outline-none"
          aria-label="Buscar na lista"
          placeholder={placeholder}
          value={query.busca}
          onChange={(e) =>
            void setQuery(
              { busca: e.target.value },
              { limitUrlUpdates: debounce(300) },
            )
          }
        />
        {query.busca && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => void setQuery({ busca: null })}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="filter-controls">
        {pending && (
          <span
            className="filter-pending"
            role="status"
            aria-label="Atualizando resultados"
          >
            <LoaderCircle size={14} className="spinning" />
          </span>
        )}
        {period && (
          <FlowSelect
            aria-label="Período"
            value={query.periodo}
            onValueChange={(value) =>
              void setQuery({ periodo: value as "upcoming" | "past" | "all" })
            }
          >
            <option value="upcoming">Próximos</option>
            <option value="past">Histórico</option>
            <option value="all">Todos os períodos</option>
          </FlowSelect>
        )}
        {statuses && (
          <FlowSelect
            aria-label="Status"
            value={query.status}
            onValueChange={(value) =>
              void setQuery({ status: panelSearch.status.parse(value) })
            }
          >
            <option value="all">Todos os status</option>
            <option value="confirmed">Confirmados</option>
            <option value="pending">Aguardando aprovação</option>
            <option value="canceled">Cancelados</option>
            <option value="completed">Concluídos</option>
            <option value="expired">Expirados</option>
            <option value="declined">Recusados</option>
            <option value="no_show">Faltas</option>
          </FlowSelect>
        )}
        {professionals.length > 1 && (
          <FlowSelect
            aria-label="Profissional"
            value={query.profissional}
            onValueChange={(value) => void setQuery({ profissional: value })}
          >
            <option value="all">Toda a equipe</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </FlowSelect>
        )}
        {active && (
          <button
            className="filter-reset"
            onClick={() =>
              void setQuery({ busca: null, status: null, profissional: null })
            }
          >
            <X size={13} />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
