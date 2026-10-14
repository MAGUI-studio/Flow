"use client";
import { Container } from "@/components/container";

import { HeroBookingPreview } from "./hero-booking-preview";
import type { BusinessCard, BusinessProfile } from "@/lib/catalog";
import { Header } from "./header";
import { Footer } from "./footer";
import { BusinessDirectory } from "./business-directory";
import { ArrowLink } from "./ui/arrow-link";
import { Plans } from "./plans";
import { AgendaPreview } from "./agenda-preview";
export function Home({
  businesses,
  previewBusiness,
  managementBusiness,
  currentPlan,
  development,
}: {
  businesses: BusinessCard[];
  previewBusiness: BusinessProfile | null;
  managementBusiness: BusinessProfile | null;
  currentPlan: string | null;
  development: boolean;
}) {
  return (
    <>
      <Header />
      <main>
        <Container
          as="section"
          className="hero relative isolate items-center gap-10 min-[701px]:grid-cols-[1.1fr_1fr] min-[701px]:gap-8"
        >
          <div className="hero-copy relative isolate min-w-0 py-4 min-[701px]:py-8">
            <img
              src="/brand/icon.svg"
              alt=""
              aria-hidden="true"
              width={486}
              height={409}
              className="pointer-events-none absolute top-12 left-0 -z-10 w-[85%] max-w-[480px] opacity-[0.035] brightness-0 select-none sm:top-16"
            />
            <div className="eyebrow inline-flex rounded-full border border-[#e8e5f6] bg-[#F5F4FF] px-3 py-2 text-[8px] tracking-[0.14em] sm:text-[9px]">
              <span className="dot" /> MAIS TEMPO PARA O QUE IMPORTA
            </div>
            <h1 className="my-7 text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.08] tracking-[-0.055em]">
              Seu próximo
              <br />
              momento começa
              <br />
              com um <span>flow.</span>
            </h1>
            <p className="max-w-[410px] text-base leading-relaxed sm:text-[17px]">
              Encontre quem cuida de você. Agende serviços com os melhores
              profissionais, no seu tempo.
            </p>
            <ArrowLink href="#explorar">Encontre seu próximo horário</ArrowLink>
            <div className="hero-note mt-8 text-[11px]">
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
          <HeroBookingPreview business={previewBusiness} />
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
        <Container as="section" id="seu-negocio" className="scroll-mt-8">
          <AgendaPreview business={managementBusiness} />
        </Container>
        <Container
          as="section"
          id="planos"
          className="scroll-mt-8 py-16 sm:py-24"
        >
          <div className="mb-10 text-center">
            <div className="eyebrow">MAIS FLOW NO SEU NEGÓCIO</div>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              O plano certo para o seu próximo passo.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-500">
              Uma ou três unidades, o mesmo cuidado com sua agenda. Compare os
              planos mensais e escolha o espaço para o seu negócio crescer.
            </p>
          </div>
          <Plans currentPlan={currentPlan} development={development} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
