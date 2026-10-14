"use client";
import { Container } from "@/components/container";

import { Check, CalendarDays, Heart, Scissors } from "lucide-react";
import type { BusinessCard } from "@/lib/catalog";
import { Header } from "./header";
import { Footer } from "./footer";
import { BusinessDirectory } from "./business-directory";
import { ArrowLink } from "./ui/arrow-link";
export function Home({ businesses }: { businesses: BusinessCard[] }) {
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
          <BusinessDirectory businesses={businesses} featured />
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
              <ArrowLink href="/planos">Conheça o Flow para negócios</ArrowLink>
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
