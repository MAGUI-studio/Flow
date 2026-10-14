"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Clock,
  Building2,
  Layers,
  ArrowUpRight,
  ChevronRight,
  Menu,
  X,
  Plus,
  Wallet,
} from "lucide-react";
import { FlowSelect } from "@/components/ui/flow-select";
import { ScrollArea } from "@/components/ui/scrollArea";
import { Container } from "@/components/container";
import { panelHref, panelSearch } from "@/lib/url-state";
type Business = { id: string; name: string; slug: string; color: string };
const navigation = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { href: "/painel/agenda", label: "Agenda", icon: CalendarDays },
  {
    href: "/painel/estabelecimentos",
    label: "Estabelecimentos",
    icon: Building2,
  },
  { href: "/painel/profissionais", label: "Profissionais", icon: Users },
  { href: "/painel/servicos", label: "Serviços", icon: Scissors },
  { href: "/painel/disponibilidade", label: "Disponibilidade", icon: Clock },
  { href: "/painel/sessoes", label: "Sessões em grupo", icon: Layers },
];
export function InternalShell({
  children,
  mode,
  businesses = [],
  plan,
}: {
  children: ReactNode;
  mode: "business" | "consumer";
  businesses?: Business[];
  plan?: string;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const [mobile, setMobile] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLButtonElement>(".mobile-only")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      menuButton.current?.focus();
    };
  }, [mobile]);
  const [query, setQuery] = useQueryStates(panelSearch, {
    shallow: false,
    history: "replace",
    scroll: false,
  });
  const current =
    businesses.find((b) => b.id === query.estabelecimento) ?? businesses[0];
  const activeLabel =
    mode === "consumer"
      ? "Meus agendamentos"
      : (navigation.find(
          (n) => n.href !== "/painel" && pathname.startsWith(n.href),
        )?.label ??
        (pathname === "/painel/assinatura"
          ? "Minha assinatura"
          : "Visão geral"));
  return (
    <div className="internal-app">
      <button
        className={`internal-scrim ${mobile ? "open" : ""}`}
        onClick={() => setMobile(false)}
        aria-label="Fechar navegação"
      />
      <aside
        ref={sidebar}
        className={`internal-sidebar left-[max(0px,calc((100vw-1760px)/2))] overflow-hidden p-0 ${mobile ? "open" : ""}`}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile ? true : undefined}
        aria-label={mobile ? "Menu do Flow" : undefined}
        onKeyDown={(event) => {
          if (!mobile) return;
          if (event.key === "Escape") {
            setMobile(false);
            return;
          }
          if (event.key === "Tab") {
            const nodes = Array.from(
              sidebar.current?.querySelectorAll<HTMLElement>(
                'a[href],button:not([disabled]),[tabindex="0"]',
              ) ?? [],
            ).filter((node) => node.getClientRects().length > 0);
            const first = nodes[0],
              last = nodes[nodes.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            }
            if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <ScrollArea className="h-full w-full">
          <div className="flex min-h-dvh flex-col px-4 pt-6 pb-4">
            <div className="internal-logo-row">
              <Link href="/" aria-label="Flow início">
                <img src="/brand/logo_black.svg" alt="Flow" />
              </Link>
              <span>workspace</span>
              <button
                className="internal-icon mobile-only"
                aria-label="Fechar menu"
                onClick={() => setMobile(false)}
              >
                <X size={18} />
              </button>
            </div>
            {mode === "business" && (
              <div className="workspace-picker">
                <span>SEU ESTABELECIMENTO</span>
                {businesses.length > 1 ? (
                  <FlowSelect
                    value={current?.id ?? ""}
                    onValueChange={(value) => {
                      void setQuery({
                        estabelecimento: value,
                        profissional: null,
                        busca: null,
                        status: null,
                      });
                    }}
                    aria-label="Selecionar estabelecimento"
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </FlowSelect>
                ) : current ? (
                  <div className="workspace-name">
                    <i style={{ background: current.color }}>
                      {current.name[0]}
                    </i>
                    <strong>{current.name}</strong>
                    <ChevronRight size={14} />
                  </div>
                ) : (
                  <Link
                    href="/painel/estabelecimentos/novo"
                    className="workspace-name"
                  >
                    <i>
                      <Plus size={16} />
                    </i>
                    <strong>Adicionar negócio</strong>
                  </Link>
                )}
              </div>
            )}
            <nav
              className="internal-navigation"
              aria-label="Navegação principal"
            >
              <span className="nav-caption">
                {mode === "business" ? "GESTÃO DO NEGÓCIO" : "SEU ESPAÇO"}
              </span>
              {mode === "business" ? (
                navigation.map((n) => {
                  const active =
                    n.href === "/painel"
                      ? pathname === n.href
                      : pathname.startsWith(n.href);
                  return (
                    <Link
                      key={n.href}
                      href={panelHref(n.href, current?.id)}
                      className={active ? "active" : ""}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobile(false)}
                    >
                      <n.icon size={18} />
                      <span>{n.label}</span>
                      {active && <i />}
                    </Link>
                  );
                })
              ) : (
                <>
                  <Link
                    className="active"
                    href="/agendamentos"
                    aria-current="page"
                  >
                    <CalendarDays size={18} />
                    Meus agendamentos
                    <i />
                  </Link>
                  <Link href="/#explorar">
                    <Scissors size={18} />
                    Explorar profissionais
                    <ArrowUpRight size={14} />
                  </Link>
                </>
              )}
              <span className="nav-caption secondary">CONTA</span>
              <Link
                href={
                  mode === "business"
                    ? panelHref("/painel/assinatura", current?.id)
                    : "/painel"
                }
                className={pathname === "/painel/assinatura" ? "active" : ""}
              >
                <Wallet size={18} />
                {mode === "business" ? "Minha assinatura" : "Meu negócio"}
              </Link>
              <Link href={mode === "business" ? "/agendamentos" : "/planos"}>
                <Users size={18} />
                {mode === "business"
                  ? "Meus agendamentos"
                  : "Flow para negócios"}
              </Link>
            </nav>
            <div className="internal-sidebar-bottom">
              {mode === "business" ? (
                <div className="plan-mini">
                  <span className="plan-mini-icon">✳</span>
                  <div>
                    <small>SEU PLANO</small>
                    <strong>
                      {plan === "multi" ? "Expandir" : "Essencial"}
                    </strong>
                  </div>
                  <Link href="/planos" aria-label="Ver planos">
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
              ) : (
                <div className="consumer-note">
                  <span>✳</span>
                  <strong>Seu tempo merece fluir.</strong>
                  <p>Um cuidado, uma pausa, um próximo momento.</p>
                </div>
              )}
              <div className="internal-profile">
                <UserButton />
                <div>
                  <strong>{user?.firstName ?? "Sua conta"}</strong>
                  <small>
                    {mode === "business"
                      ? "Responsável pelo negócio"
                      : "Sua conta Flow"}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>
      <div className="internal-stage" inert={mobile ? true : undefined}>
        <header className="internal-topbar">
          <div>
            <button
              className="internal-icon mobile-only"
              ref={menuButton}
              onClick={() => setMobile(true)}
              aria-label="Abrir menu"
            >
              <Menu size={19} />
            </button>
            <span className="topbar-root">
              {mode === "business" ? "Meu negócio" : "Minha conta"}
            </span>
            <ChevronRight size={13} />
            <strong>{activeLabel}</strong>
          </div>
          <div>
            <span className="workspace-status">
              <i />
              Tudo no seu tempo
            </span>
            {mode === "business" && current ? (
              <Link
                className="public-page-link"
                href={`/${current.slug}`}
                target="_blank"
              >
                Ver minha página
                <ArrowUpRight size={15} />
              </Link>
            ) : (
              <Link className="public-page-link" href="/#explorar">
                Explorar
                <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
        </header>
        <Container
          as="main"
          className="internal-content max-w-none px-4 sm:px-6 lg:px-9"
        >
          {children}
        </Container>
        <footer className="internal-footer">
          <span>Flow · Seu tempo, organizado.</span>
          <span>
            Feito por <strong>MAGUI.studio</strong>
          </span>
        </footer>
      </div>
    </div>
  );
}
