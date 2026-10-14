"use client";
import { useState } from "react";
import Link from "next/link";
import { FlowSelect } from "@/components/ui/flow-select";
import {
  ArrowUpRight,
  Search,
  MapPin,
  ArrowRight,
  Check,
  CalendarDays,
  Sparkles,
  Heart,
  Scissors,
  Stethoscope,
  Globe,
} from "lucide-react";
import type { BusinessCard } from "@/lib/catalog";
import { Header } from "./header";
export function Home({ businesses }: { businesses: BusinessCard[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [city, setCity] = useState("");
  const [modality, setModality] = useState("all");
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
        <section className="hero wrap">
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
            <a href="#explorar" className="button">
              Encontre seu próximo horário <ArrowUpRight size={19} />
            </a>
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
            <div className="art-orbit" />
            <span className="art-label">
              <Sparkles size={15} /> O seu dia, mais leve.
            </span>
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
        </section>
        <div className="trust-strip">
          <div className="wrap">
            Do cuidado de todo dia à sua próxima descoberta.
            <span>
              <Scissors size={17} /> Beleza & estilo
            </span>
            <span>
              <Stethoscope size={17} /> Saúde
            </span>
            <span>
              <Heart size={17} /> Bem-estar
            </span>
          </div>
        </div>
        <section className="explore wrap" id="explorar">
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
          <div className="search-box">
            <Search size={20} />
            <input
              aria-label="Busque um serviço ou estabelecimento"
              placeholder="O que você está procurando?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="search-city">
              <MapPin size={18} />
              <input
                aria-label="Cidade ou online"
                placeholder="Cidade ou online"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <FlowSelect
              className="modality-filter"
              aria-label="Modalidade"
              value={modality}
              onValueChange={setModality}
            >
              <option value="all">Todas as modalidades</option>
              <option value="in_person">Presencial</option>
              <option value="online">Online</option>
            </FlowSelect>
            <button
              className="button small"
              onClick={() =>
                document
                  .getElementById("results")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            >
              Buscar <ArrowRight size={17} />
            </button>
          </div>
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
        </section>
        <section id="como-funciona" className="how wrap">
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
        </section>
        <section className="business-cta wrap">
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
          <div className="cta-symbol">✳</div>
        </section>
      </main>
      <footer className="footer wrap">
        <div>
          <img className="logo" src="/brand/logo_black.svg" alt="Flow" />
          <span>Seu tempo merece fluir.</span>
        </div>
        <span>
          Um produto <strong>MAGUI.studio</strong>
        </span>
        <span>© {new Date().getFullYear()} Flow</span>
      </footer>
    </>
  );
}
