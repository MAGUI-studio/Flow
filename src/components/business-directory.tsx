"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debounce, useQueryStates } from "nuqs";
import { Search, MapPin, ArrowUpRight, ArrowRight, Globe } from "lucide-react";
import { FlowSelect } from "./ui/flow-select";
import { ArrowButton, ArrowLink } from "./ui/arrow-link";
import { catalogSearchSchema } from "@/lib/form-schemas";
import {
  directorySearch,
  directoryHref,
  filterDirectory,
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
  const visible = featured ? found.slice(0, 8) : found;
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
                { busca: e.target.value },
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
                  { cidade: e.target.value },
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
            onClick={() => void setQuery({ categoria: c })}
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
          <Link className="business-card" key={b.slug} href={`/${b.slug}`}>
            <div className="business-cover" style={{ background: b.color }}>
              <div className="cover-lines" />
              <span className="business-monogram">
                {b.initials}
                <span>✳</span>
              </span>
              <span className="cover-tag">
                {b.online ? <Globe size={12} /> : <MapPin size={12} />}{" "}
                {b.online ? "Atendimento online" : b.city}
              </span>
              <span className="cover-arrow">
                <ArrowUpRight size={19} />
              </span>
            </div>
            <div className="business-info">
              <small>{b.tag}</small>
              <h3>{b.name}</h3>
              <p>{b.description}</p>
              <div>
                Conhecer e agendar <ArrowRight size={16} />
              </div>
            </div>
          </Link>
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
              })
            }
          >
            Limpar filtros
          </button>
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
