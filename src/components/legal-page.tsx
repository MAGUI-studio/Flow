import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  FileText,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Container } from "./container";
import { Header } from "./header";
import { Footer } from "./footer";
import { LegalNavigation } from "./legal-navigation";

export type LegalSection = { id: string; title: string; content: ReactNode };

export function LegalContact() {
  return (
    <p>
      O Flow é uma iniciativa da MAGUI.studio. Para falar sobre sua conta,
      pagamentos ou privacidade, escreva para{" "}
      <a href="mailto:contato@magui.studio">contato@magui.studio</a>.
    </p>
  );
}

export function LegalPage({
  title,
  description,
  kind,
  sections,
}: {
  title: string;
  description: string;
  kind: "terms" | "privacy";
  sections: LegalSection[];
}) {
  const isTerms = kind === "terms";
  const Icon = isTerms ? FileText : ShieldCheck;
  const highlights = isTerms
    ? [
        "Acompanhe suas reservas pela sua conta.",
        "Confira as condições antes de contratar.",
        "Conte com um canal direto para dúvidas.",
      ]
    : [
        "Entenda para que seus dados são usados.",
        "Conheça quem participa do tratamento.",
        "Saiba como exercer seus direitos.",
      ];

  return (
    <div id="inicio" className="mx-auto w-full max-w-[1200px]">
      <Header />
      <Container as="main" className="pt-5 pb-12 sm:pt-8 sm:pb-20">
        <Link
          href="/"
          className="mb-7 inline-flex min-h-9 items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-[#635BFF]"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Voltar para o Flow
        </Link>
        <header className="relative isolate overflow-hidden rounded-[28px] border border-[#e7e3f5] bg-[#F5F4FF] p-6 sm:p-10 lg:p-12">
          <Icon
            aria-hidden="true"
            strokeWidth={0.7}
            className="pointer-events-none absolute -right-8 -bottom-14 -z-10 size-72 -rotate-12 text-[#635BFF]/[0.055] sm:size-96"
          />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#635BFF]/15 bg-white px-3 py-1.5 text-[10px] font-medium tracking-[.13em] text-[#635BFF] uppercase">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-[#635BFF]"
                />{" "}
                Transparência, em primeiro lugar
              </span>
              <h1 className="mt-6 text-4xl leading-[1.12] font-semibold tracking-[-.045em] sm:text-5xl lg:text-[56px]">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
                {description}
              </p>
              <p className="mt-6 flex items-center gap-2 text-[11px] text-zinc-500">
                <CalendarDays size={14} aria-hidden="true" /> Atualizado em{" "}
                <time dateTime="2026-10-22">22 de outubro de 2026</time>
              </p>
            </div>
            <div className="rounded-2xl border border-white bg-white/80 p-6">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-[#F5F4FF] text-[#635BFF]">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <p className="text-sm font-medium">
                  {isTerms
                    ? "Para usar com tranquilidade"
                    : "Seus dados, com clareza"}
                </p>
              </div>
              <ul className="space-y-4">
                {highlights.map((text) => (
                  <li
                    key={text}
                    className="flex items-start gap-2.5 text-xs leading-6 text-zinc-600"
                  >
                    <Check
                      size={14}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-[#635BFF]"
                    />
                    {text}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-zinc-100 pt-4 text-[10px] leading-5 text-zinc-400">
                Uma visão geral para começar. As condições completas estão logo
                abaixo.
              </p>
            </div>
          </div>
        </header>
        <nav
          aria-label="Documentos legais"
          className="mt-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-6"
        >
          {[
            {
              href: "/termos",
              label: "Termos de Uso",
              current: isTerms,
              icon: FileText,
            },
            {
              href: "/privacidade",
              label: "Política de Privacidade",
              current: !isTerms,
              icon: ShieldCheck,
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 aria-[current=page]:border-[#e7e3f5] aria-[current=page]:bg-white aria-[current=page]:text-[#635BFF]"
            >
              <item.icon size={15} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 grid items-start gap-8 lg:mt-10 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-8 xl:gap-10">
          <LegalNavigation
            sections={sections.map(({ id, title }) => ({ id, title }))}
          />
          <article className="min-w-0 rounded-3xl border border-[#e9e7f0] bg-white px-5 sm:px-9 lg:px-12">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-8 border-b border-zinc-100 py-8 last:border-0 sm:py-10"
              >
                <div className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-x-4 gap-y-5 sm:gap-x-5">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#eeebf8] bg-[#faf9ff] text-xs font-medium text-[#635BFF] tabular-nums"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2
                    id={`${section.id}-title`}
                    className="m-0! flex min-h-9 items-center text-lg leading-7 tracking-tight sm:text-xl"
                  >
                    {section.title}
                  </h2>
                  <div className="col-span-2 min-w-0 space-y-4 text-[13px] leading-[1.9] text-zinc-600 sm:col-span-1 sm:col-start-2 sm:text-sm sm:leading-7 [&_a]:break-words [&_a]:text-[#635BFF] [&_a]:underline [&_a]:decoration-[#635BFF]/30 [&_a]:underline-offset-4 [&_a:hover]:decoration-[#635BFF] [&_strong]:font-medium [&_strong]:text-zinc-800 [&_li]:pl-1 [&_li::marker]:text-[#a49fff] [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pl-4">
                    {section.content}
                  </div>
                </div>
              </section>
            ))}
            <div className="flex flex-col items-start justify-between gap-4 border-t border-zinc-100 py-7 sm:flex-row sm:items-center">
              <p className="text-xs leading-6 text-zinc-500">
                Ficou alguma dúvida? Estamos por aqui.
              </p>
              <a
                href="mailto:contato@magui.studio"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#F5F4FF] px-4 py-2 text-xs font-medium text-[#635BFF] transition-colors hover:bg-[#eeebff]"
              >
                Falar com a MAGUI.studio{" "}
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </Container>
      <Footer />
    </div>
  );
}
