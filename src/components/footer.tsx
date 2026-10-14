import Link from "next/link";
import { ArrowUpRight, ArrowUp } from "lucide-react";
import { Container } from "./container";
import { StudioCredit } from "./studio-credit";

const studio = "https://magui.studio/";
function Instagram({
  size = 17,
  strokeWidth = 1.6,
}: {
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}
function Linkedin({ size = 17 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M5.4 7.5a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2ZM3.6 9h3.6v12H3.6V9Zm5.9 0H13v1.6c.5-.9 1.6-1.9 3.6-1.9 3.8 0 4.5 2.4 4.5 5.5V21h-3.6v-6c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21H9.5V9Z" />
    </svg>
  );
}
const socials = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/_magui.studio",
    icon: Instagram,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/magui-studio",
    icon: Linkedin,
  },
];
const groups = [
  {
    title: "Explore o Flow",
    links: [
      { label: "Encontre um serviço", href: "/explorar" },
      { label: "Como funciona", href: "/#como-funciona" },
      { label: "Flow para negócios", href: "/#planos" },
    ],
  },
  {
    title: "Seu espaço",
    links: [
      { label: "Meus agendamentos", href: "/agendamentos" },
      { label: "Painel do negócio", href: "/painel" },
      { label: "Entrar com Google", href: "/entrar" },
    ],
  },
  {
    title: "Por trás do Flow",
    links: [
      { label: "MAGUI.studio", href: studio },
      { label: "Nosso portfólio", href: "https://portfolio.magui.studio/" },
      { label: "Forever", href: "https://forever.magui.studio/" },
    ],
  },
];

export function Footer() {
  return (
    <Container
      as="footer"
      id="rodape"
      aria-label="Rodapé do Flow"
      className="pt-6 pb-6 sm:pb-9"
    >
      <div className="relative isolate overflow-hidden rounded-3xl bg-[#101014] text-white">
        <img
          src="/brand/icon.svg"
          alt=""
          aria-hidden="true"
          width={486}
          height={409}
          className="pointer-events-none absolute -right-20 -bottom-20 -z-10 w-[420px] max-w-none opacity-[0.045] brightness-0 invert select-none sm:-right-28 sm:-bottom-32 sm:w-[640px] lg:w-[760px]"
        />
        <div className="grid gap-10 px-7 pt-10 pb-9 sm:px-10 sm:pt-12 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <Link
              href="/"
              aria-label="Flow início"
              className="inline-block rounded focus-visible:outline-offset-8"
            >
              <img
                src="/brand/logo_white.svg"
                alt="Flow"
                width={102}
                height={42}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-6 text-base font-medium tracking-tight text-zinc-100">
              Seu tempo, em boa companhia.
            </p>
            <p className="mt-3 max-w-72 text-xs leading-7 text-zinc-400">
              Encontre quem cuida de você. Organize seus atendimentos. Deixe os
              próximos momentos fluírem.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {socials.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} da MAGUI.studio (abre em nova aba)`}
                  className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/4 text-zinc-400 transition-colors hover:border-[#a49fff]/50 hover:bg-[#635BFF]/15 hover:text-white"
                >
                  <Icon size={17} strokeWidth={1.6} />
                </a>
              ))}
              <a
                href="https://x.com/magui_studio"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X da MAGUI.studio (abre em nova aba)"
                className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/4 text-zinc-400 transition-colors hover:border-[#a49fff]/50 hover:bg-[#635BFF]/15 hover:text-white"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 fill-current"
                >
                  <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-7.4L5.5 22H2.3l7.2-8.4L.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20Z" />
                </svg>
              </a>
              <span className="ml-2 text-[10px] text-zinc-400">
                Acompanhe o studio
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:pt-2">
            {groups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="text-[10px] font-medium! tracking-[0.12em] text-zinc-400 uppercase">
                  {group.title}
                </h2>
                <ul className="mt-5 space-y-4">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        {...(link.href.startsWith("https:")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="group inline-flex items-center gap-1.5 text-xs text-zinc-300 transition-colors hover:text-[#a49fff]"
                      >
                        {link.label}
                        {link.href.startsWith("https:") && (
                          <ArrowUpRight
                            size={12}
                            className="text-zinc-600 transition-colors group-hover:text-[#a49fff]"
                          />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mx-7 flex flex-col gap-5 border-t border-white/8 py-6 sm:mx-10 sm:flex-row sm:items-center sm:justify-between">
          <StudioCredit />
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-[10px] text-zinc-400">
            <span>
              © {new Date().getFullYear()} Flow. Todos os direitos reservados.
            </span>
            <Link
              href="#inicio"
              className="inline-flex shrink-0 items-center gap-2 transition-colors hover:text-white"
            >
              Voltar ao topo
              <ArrowUp size={12} />
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
