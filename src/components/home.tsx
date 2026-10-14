"use client";
import { Container } from "@/components/container";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { catalogSearchSchema } from "@/lib/form-schemas";
import Link from "next/link";
import { FlowSelect } from "@/components/ui/flow-select";
import {
  ArrowUpRight,
  Search,
  MapPin,
  ArrowRight,
  Check,
  CalendarDays,
  Heart,
  Scissors,
  Stethoscope,
  Globe,
} from "lucide-react";
import type { BusinessCard } from "@/lib/catalog";
import { Header } from "./header";
import { Footer } from "./footer";
import { ArrowLink } from "./ui/arrow-link";
export function Home({ businesses }: { businesses: BusinessCard[] }) {
  const searchForm = useForm({
    resolver: zodResolver(catalogSearchSchema),
    defaultValues: {
      query: "",
      city: "",
      modality: "all" as "all" | "in_person" | "online",
    },
  });
  const { query, city, modality } = searchForm.watch();
  const [category, setCategory] = useState("Todos");
  const categories = ["Todos", ...new Set(businesses.map((b) => b.category))];
  const found = businesses.filter(
    (b) =>
      (category === "Todos" || b.category === category) &&
      `${b.name} ${b.tag} ${b.serviceNames.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      b.city.toLowerCase().includes(city.toLowerCase()) &&
      (modality === "all" || b.modalities.includes(modality)),
  );
  return (
    <>
      <Header />
      <main>
        <Container as="section" className="hero relative isolate">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="dot" /> MAIS TEMPO PARA O QUE IMPORTA
            </div>
            <h1>
              Seu próximo
              <br />
              momento começa
              <br />
              com um <span>flow.</span>
            </h1>
            <p>
              Encontre quem cuida de você. Agende serviços com os melhores
              profissionais, no seu tempo.
            </p>
            <ArrowLink href="#explorar">Encontre seu próximo horário</ArrowLink>
            <div className="hero-note">
              <span className="mini-avatars">
                <i>J</i>
                <i>M</i>
                <i>A</i>
              </span>
              <span>
                Menos idas e vindas.
                <br />
                <strong>Mais tempo para viver.</strong>
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="Ilustração de uma agenda organizada"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rotate-[-22deg] scale-95 rounded-full border border-[#e8e5f6]"
            >
              <div className="absolute inset-8 rounded-full border border-[#e8e5f6]/70" />
            </div>
            <div className="absolute -top-1 right-2 z-10 flex rotate-3 items-center gap-3 rounded-2xl border border-[#e8e5f6] bg-white px-4 py-3 shadow-[0_8px_24px_#3023650a]">
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-xl bg-[#F5F4FF]"
              >
                <span className="size-2 rounded-full bg-[#635BFF]" />
              </span>
              <div>
                <span className="block text-[8px] font-medium tracking-[0.15em] text-zinc-400 uppercase">
                  Menos correria
                </span>
                <p className="mt-1 text-xs font-medium text-zinc-700">
                  O seu dia, mais leve.
                </p>
              </div>
            </div>
            <div className="calendar-card">
              <div className="calendar-title">
                <div className="icon-square">
                  <CalendarDays size={22} />
                </div>
                <div>
                  <strong>Sua próxima pausa</strong>
                  <small>Um cuidado só seu</small>
                </div>
                <span className="calendar-dots">•••</span>
              </div>
              <div className="month">
                Outubro <span>‹　›</span>
              </div>
              <div className="week">
                {["SEG", "TER", "QUA", "QUI", "SEX"].map((d, i) => (
                  <div className={i === 2 ? "selected-day" : ""} key={d}>
                    <small>{d}</small>
                    <b>{12 + i}</b>
                  </div>
                ))}
              </div>
              <div className="appointment">
                <span className="time">10:00</span>
                <div>
                  <strong>Corte e finalização</strong>
                  <small>Studio Aurora · com Marina</small>
                </div>
                <span className="appt-icon">
                  <Scissors size={20} />
                </span>
              </div>
              <div className="appointment muted">
                <span className="time">14:30</span>
                <div>
                  <strong>Um momento de equilíbrio</strong>
                  <small>Movimento Yoga · com Beatriz</small>
                </div>
                <Heart size={19} />
              </div>
              <div className="card-bottom">
                <span className="dot" /> Tudo no seu tempo.
              </div>
            </div>
            <div className="confirmed">
              <span>
                <Check size={20} />
              </span>
              <div>
                <strong>Horário confirmado!</strong>
                <small>Agora é só aproveitar seu momento.</small>
              </div>
            </div>
            <img className="art-brand" src="/brand/icon.svg" alt="" />
          </div>
        </Container>
        <Container
          as="section"
          aria-label="Cuidados para cada momento"
          className="grid items-center gap-6 py-6 lg:grid-cols-[1fr_2fr] lg:gap-12"
        >
          <div>
            <span className="text-[9px] font-medium tracking-[0.15em] text-[#635BFF] uppercase">
              Encontre seu momento
            </span>
            <h2 className="mt-3 max-w-72 text-xl leading-snug tracking-tight text-zinc-800">
              Do cuidado de todo dia à sua próxima descoberta.
            </h2>
          </div>
          <ul className="grid grid-cols-3 gap-3">
            {[
              { label: "Beleza & estilo", icon: Scissors },
              { label: "Saúde", icon: Stethoscope },
              { label: "Bem-estar", icon: Heart },
            ].map(({ label, icon: Icon }) => (
              <li
                key={label}
                className="relative isolate flex min-h-28 items-end overflow-hidden rounded-2xl border border-[#eae7f3] bg-[#faf9ff] p-4 sm:p-5"
              >
                <Icon
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-3 -bottom-3 -z-10 size-24 rotate-[-12deg] stroke-[1.2] text-[#635BFF]/10"
                />
                <span className="max-w-28 text-xs font-medium leading-relaxed text-zinc-700 sm:text-sm">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </Container>
        <Container as="section" className="explore" id="explorar">
          <div className="section-heading">
            <div className="eyebrow">DESCUBRA SEU PRÓXIMO MOMENTO</div>
            <h2>
              Bons profissionais.
              <br />
              Bem perto de você.
            </h2>
            <p>
              Explore espaços e pessoas que fazem a diferença na sua rotina.
            </p>
          </div>
          <form
            className="search-box"
            noValidate
            onSubmit={searchForm.handleSubmit(() =>
              document
                .getElementById("results")
                ?.scrollIntoView({ behavior: "smooth", block: "center" }),
            )}
          >
            <Search size={20} />
            <input
              aria-label="Busque um serviço ou estabelecimento"
              placeholder="O que você está procurando?"
              {...searchForm.register("query")}
            />
            <div className="search-city">
              <MapPin size={18} />
              <input
                aria-label="Cidade ou online"
                placeholder="Cidade ou online"
                {...searchForm.register("city")}
              />
            </div>
            <FlowSelect
              className="modality-filter"
              aria-label="Modalidade"
              value={modality}
              onValueChange={(v) =>
                searchForm.setValue(
                  "modality",
                  catalogSearchSchema.shape.modality.parse(v),
                )
              }
            >
              <option value="all">Todas as modalidades</option>
              <option value="in_person">Presencial</option>
              <option value="online">Online</option>
            </FlowSelect>
            <button type="submit" className="button small">
              Buscar <ArrowRight size={17} />
            </button>
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
                onClick={() => setCategory(c)}
                className={c === category ? "active" : ""}
              >
                {c}
              </button>
            ))}
            <span>
              {found.length}{" "}
              {found.length === 1
                ? "espaço para descobrir"
                : "espaços para descobrir"}
            </span>
          </div>
          <div id="results" className="business-grid">
            {found.map((b) => (
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
            <div className="empty">
              Nenhum espaço encontrado. Experimente outra busca.
            </div>
          )}
        </Container>
        <Container as="section" id="como-funciona" className="how">
          <div>
            <div className="eyebrow">SIMPLES, DO COMEÇO AO FIM</div>
            <h2>
              Agendar também
              <br />
              pode ser leve.
            </h2>
            <p>
              Sem troca infinita de mensagens.
              <br />
              Seu próximo horário, em poucos passos.
            </p>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Encontre seu espaço",
                "Explore serviços e escolha quem combina com você.",
              ],
              [
                "02",
                "Escolha seu momento",
                "Selecione o profissional e um horário disponível.",
              ],
              [
                "03",
                "Pronto. É tempo de você.",
                "Entre com Google e acompanhe tudo na sua conta.",
              ],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <article>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              </div>
            ))}
          </div>
        </Container>
        <Container as="section">
          <div className="business-cta px-6 py-9 sm:px-10 sm:py-11">
            <div>
              <div className="eyebrow">FLOW PARA SEU NEGÓCIO</div>
              <h2>
                Você cuida do seu talento.
                <br />A gente organiza o caminho.
              </h2>
              <p>Sua página, sua equipe e sua agenda. Tudo em um só lugar.</p>
              <Link className="button" href="/planos">
                Conheça o Flow para negócios <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="cta-symbol" aria-hidden="true">
              ✳
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
