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
  professionalFilters = false,
  serviceFilters = false,
}: {
  placeholder?: string;
  statuses?: boolean;
  period?: boolean;
  professionals?: { id: string; name: string }[];
  preview?: boolean;
  professionalFilters?: boolean;
  serviceFilters?: boolean;
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
    (serviceFilters &&
      (query.modalidade !== "all" ||
        query.tipo !== "all" ||
        query.preco !== "all" ||
        query.ordemServico !== "name_asc")) ||
    query.busca ||
    query.status !== "all" ||
    query.profissional !== "all" ||
    (professionalFilters &&
      (query.ordem !== "name_asc" || query.vinculos !== "all"));
  const separateFilters = professionalFilters || serviceFilters;
  return (
    <div
      className={
        separateFilters
          ? "mb-5 grid min-w-0 gap-3 lg:grid-cols-[minmax(220px,1fr)_auto] lg:items-start"
          : "internal-filters"
      }
    >
      <div
        className={
          separateFilters
            ? "internal-search min-h-11 min-w-0! rounded-xl border border-zinc-200 bg-white px-3! transition-colors [&>svg]:shrink-0 focus-within:border-[#635BFF]/40 focus-within:ring-2 focus-within:ring-[#635BFF]/10"
            : "internal-search rounded-lg border border-transparent transition-colors focus-within:border-[#635BFF]/40 focus-within:bg-[#F5F4FF]/60 focus-within:ring-2 focus-within:ring-[#635BFF]/10"
        }
      >
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
      <div
        className={
          separateFilters
            ? `filter-controls grid! w-full! min-w-0 grid-cols-1 gap-2! sm:grid-cols-2 lg:flex! lg:w-auto! [&_.flow-select-trigger]:min-h-11! [&_.flow-select-trigger]:w-full! [&_.flow-select-trigger]:min-w-0! [&_.flow-select-trigger]:max-w-none! [&_.flow-select-trigger]:rounded-xl! [&_.flow-select-trigger]:bg-white [&_.flow-select-trigger]:text-xs! lg:[&_.flow-select-trigger]:w-auto! ${serviceFilters ? "sm:grid-cols-3" : ""}`
            : "filter-controls"
        }
      >
        {serviceFilters && (
          <>
            <FlowSelect
              aria-label="Modalidade do serviço"
              value={query.modalidade}
              onValueChange={(value) =>
                void setQuery({
                  modalidade: panelSearch.modalidade.parse(value),
                })
              }
            >
              <option value="all">Todas as modalidades</option>
              <option value="in_person">Presencial</option>
              <option value="online">Online</option>
            </FlowSelect>
            <FlowSelect
              aria-label="Tipo de atendimento"
              value={query.tipo}
              onValueChange={(value) =>
                void setQuery({ tipo: panelSearch.tipo.parse(value) })
              }
            >
              <option value="all">Todos os tipos</option>
              <option value="individual">Individual</option>
              <option value="collective">Em grupo</option>
            </FlowSelect>
            <FlowSelect
              aria-label="Valor do serviço"
              value={query.preco}
              onValueChange={(value) =>
                void setQuery({ preco: panelSearch.preco.parse(value) })
              }
            >
              <option value="all">Todos os valores</option>
              <option value="free">Gratuitos</option>
              <option value="paid">Pagos</option>
            </FlowSelect>
          </>
        )}
        {professionalFilters && (
          <>
            <FlowSelect
              aria-label="Ordenar profissionais"
              value={query.ordem}
              onValueChange={(value) =>
                void setQuery({ ordem: panelSearch.ordem.parse(value) })
              }
            >
              <option value="name_asc">Nome: A–Z</option>
              <option value="name_desc">Nome: Z–A</option>
              <option value="services_desc">Mais serviços vinculados</option>
              <option value="services_asc">Menos serviços vinculados</option>
            </FlowSelect>
            <FlowSelect
              aria-label="Filtrar vínculos de serviços"
              value={query.vinculos}
              onValueChange={(value) =>
                void setQuery({ vinculos: panelSearch.vinculos.parse(value) })
              }
            >
              <option value="all">Todos os profissionais</option>
              <option value="linked">Com serviços vinculados</option>
              <option value="unlinked">Sem serviços vinculados</option>
            </FlowSelect>
          </>
        )}
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
              void setQuery({
                busca: null,
                status: null,
                profissional: null,
                ...(serviceFilters
                  ? {
                      modalidade: null,
                      tipo: null,
                      preco: null,
                      ordemServico: null,
                    }
                  : {}),
                ...(professionalFilters ? { ordem: null, vinculos: null } : {}),
              })
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
