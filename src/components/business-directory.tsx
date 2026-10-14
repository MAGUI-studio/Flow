"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debounce, useQueryStates } from "nuqs";
import { Search, MapPin } from "lucide-react";
import { BusinessListingCard } from "./business-listing-card";
import { FlowSelect } from "./ui/flow-select";
import { ArrowButton, ArrowLink } from "./ui/arrow-link";
import { Pagination } from "./ui/pagination";
import { catalogSearchSchema } from "@/lib/form-schemas";
import {
  directorySearch,
  directoryHref,
  filterDirectory,
  paginateDirectory,
} from "@/lib/directory-state";
import type { BusinessCard } from "@/lib/catalog";
export function BusinessDirectory({
  businesses,
  featured = false,
}: {
  businesses: BusinessCard[];
  featured?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useQueryStates(directorySearch, {
    history: "replace",
    scroll: false,
  });
  const searchForm = useForm({
    resolver: zodResolver(catalogSearchSchema),
    values: {
      query: query.busca,
      city: query.cidade,
      modality: query.modalidade,
    },
  });
  const categories = ["Todos", ...new Set(businesses.map((b) => b.category))];
  const found = filterDirectory(businesses, query);
  const pagination = paginateDirectory(found, query.pagina);
  const visible = featured ? found.slice(0, 8) : pagination.rows;
  return (
    <>
      <form
        className="search-box"
        noValidate
        onSubmit={searchForm.handleSubmit(() => {
          if (featured) router.push(directoryHref("/explorar", query));
          else
            document
              .getElementById("results")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
        })}
      >
        <Search size={20} />
        <input
          aria-label="Busque um serviço ou estabelecimento"
          placeholder="O que você está procurando?"
          {...searchForm.register("query", {
            onChange: (e) =>
              void setQuery(
                { busca: e.target.value, pagina: null },
                { limitUrlUpdates: debounce(300) },
              ),
          })}
        />
        <div className="search-city">
          <MapPin size={18} />
          <input
            aria-label="Cidade ou online"
            placeholder="Cidade ou online"
            {...searchForm.register("city", {
              onChange: (e) =>
                void setQuery(
                  { cidade: e.target.value, pagina: null },
                  { limitUrlUpdates: debounce(300) },
                ),
            })}
          />
        </div>
        <FlowSelect
          className="modality-filter"
          aria-label="Modalidade"
          value={query.modalidade}
          onValueChange={(v) =>
            void setQuery({
              modalidade: catalogSearchSchema.shape.modality.parse(v),
              pagina: null,
            })
          }
        >
          <option value="all">Todas as modalidades</option>
          <option value="in_person">Presencial</option>
          <option value="online">Online</option>
        </FlowSelect>
        <ArrowButton type="submit">Buscar</ArrowButton>
      </form>
      {(searchForm.formState.errors.query ||
        searchForm.formState.errors.city) && (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {searchForm.formState.errors.query?.message ??
            searchForm.formState.errors.city?.message}
        </p>
      )}
      <div className="filters">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => void setQuery({ categoria: c, pagina: null })}
            aria-pressed={c === query.categoria}
            className={
              c === query.categoria
                ? "active border-[#635BFF] bg-[#635BFF] text-white hover:bg-[#5046E5]"
                : ""
            }
          >
            {c}
          </button>
        ))}
        <span aria-live="polite">
          {found.length}{" "}
          {found.length === 1
            ? "espaço para descobrir"
            : "espaços para descobrir"}
        </span>
      </div>
      <div id="results" className="business-grid">
        {visible.map((b) => (
          <BusinessListingCard key={b.slug} business={b} />
        ))}
      </div>
      {found.length === 0 && (
        <div className="empty flex flex-col items-center gap-5">
          Nenhum espaço encontrado. Experimente outra busca.
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              void setQuery({
                busca: null,
                cidade: null,
                categoria: null,
                modalidade: null,
                pagina: null,
              })
            }
          >
            Limpar filtros
          </button>
        </div>
      )}

      {!featured && found.length > 0 && (
        <div>
          <p role="status" className="mt-8 text-center text-xs text-zinc-500">
            Mostrando {(pagination.page - 1) * 8 + 1}–
            {Math.min(pagination.page * 8, found.length)} de {found.length}{" "}
            espaços
          </p>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(pagina) => {
              void setQuery({ pagina }, { history: "push" });
              document
                .getElementById("results")
                ?.scrollIntoView({ block: "start" });
            }}
          />
        </div>
      )}
      {featured && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-xs text-zinc-500">
            {found.length > 8
              ? `Mostrando 8 de ${found.length} espaços`
              : "Encontre mais opções para o seu próximo momento."}
          </p>
          <ArrowLink href={directoryHref("/explorar", query)}>
            Explorar todos os espaços
          </ArrowLink>
        </div>
      )}
    </>
  );
}
