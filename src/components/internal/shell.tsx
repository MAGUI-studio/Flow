"use client";
import { NotificationsDrawer } from "../notifications-drawer";
import { AccountMenu } from "../account-menu";
import { NavigationIndicator } from "@/components/ui/navigation-indicator";
import { AnimatedArrow } from "@/components/ui/animated-arrow";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useUser } from "@clerk/nextjs";
import {
  HeartIcon as Heart,
  CalendarDotsIcon as CalendarDays,
  UsersIcon as Users,
  CompassIcon as Compass,
  CaretRightIcon as ChevronRight,
  ListIcon as Menu,
  XIcon as X,
  PlusIcon as Plus,
  WalletIcon as Wallet,
  BuildingsIcon as Buildings,
  ArrowLeftIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react";
import { FlowSelect } from "@/components/ui/flow-select";
import { ScrollArea } from "@/components/ui/scrollArea";
import { Container } from "@/components/container";
import { panelHref, panelSearch } from "@/lib/url-state";
type Business = {
  id: string;
  name: string;
  slug: string;
  color: string;
  published?: boolean;
};
import { businessNavigation as navigation } from "@/lib/navigation";
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
  const navigationRef = useRef<HTMLElement>(null);
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
      ? pathname === "/favoritos"
        ? "Meus favoritos"
        : "Meus agendamentos"
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
        <ScrollArea
          className="h-full w-full pr-2"
          viewportClassName="[&>div]:block! [&>div]:w-full [&>div]:min-w-0"
        >
          <div className="flex min-h-dvh w-full min-w-0 flex-col px-4 pt-6 pb-4">
            <div className="internal-logo-row">
              <Link href="/" aria-label="Flow início">
                <img src="/brand/logo_black.svg" alt="Flow" />
              </Link>
              <button
                className="internal-icon mobile-only"
                aria-label="Fechar menu"
                onClick={() => setMobile(false)}
              >
                <X size={18} />
              </button>
            </div>
            {mode === "business" && plan === "multi" && (
              <div className="workspace-picker">
                <span>SEU ESTABELECIMENTO</span>
                {businesses.length > 0 ? (
                  <FlowSelect
                    value={current?.id ?? ""}
                    onValueChange={(value) => {
                      void setQuery({
                        estabelecimento: value,
                        profissional: null,
                        servicos: null,
                        profissionais: null,
                        combinarServicos: null,
                        combinarProfissionais: null,
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
              ref={navigationRef}
              className="internal-navigation relative [&>a]:pr-7"
              aria-label="Navegação principal"
            >
              <NavigationIndicator
                containerRef={navigationRef}
                activeKey={`${pathname}:${mode}:${plan}:${businesses.length}:${mobile}`}
              />
              {mode === "consumer" && (
                <span className="nav-caption">SEU ESPAÇO</span>
              )}
              {mode === "business" ? (
                navigation.map((n, index) => {
                  const active =
                    n.href === "/painel"
                      ? pathname === n.href
                      : pathname.startsWith(n.href);
                  return (
                    <Fragment key={n.href}>
                      {n.group && n.group !== navigation[index - 1]?.group && (
                        <span className="nav-caption mt-5 mb-1 uppercase">
                          {n.group}
                        </span>
                      )}
                      <Link
                        key={n.href}
                        href={panelHref(n.href, current?.id)}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMobile(false)}
                      >
                        <n.icon size={18} />
                        <span>{n.label}</span>
                      </Link>
                    </Fragment>
                  );
                })
              ) : (
                <>
                  <Link
                    href="/agendamentos"
                    aria-current={
                      pathname === "/agendamentos" ? "page" : undefined
                    }
                    onClick={() => setMobile(false)}
                  >
                    <CalendarDays size={18} />
                    <span>Meus agendamentos</span>
                  </Link>
                </>
              )}
              <Link
                href="/favoritos"
                aria-current={pathname === "/favoritos" ? "page" : undefined}
                onClick={() => setMobile(false)}
              >
                <Heart size={18} />
                <span>Meus favoritos</span>
              </Link>
              {mode === "consumer" && (
                <Link href="/explorar" onClick={() => setMobile(false)}>
                  <Compass size={18} />
                  <span>Explorar</span>
                  <AnimatedArrow size={14} />
                </Link>
              )}
              {(mode === "business" || !!plan) && (
                <span className="nav-caption secondary">NEGÓCIO</span>
              )}
              {(mode === "business" || !!plan) && (
                <Link
                  href={
                    mode === "business"
                      ? panelHref("/painel/assinatura", current?.id)
                      : "/painel"
                  }
                  aria-current={
                    pathname === "/painel/assinatura" ? "page" : undefined
                  }
                >
                  {mode === "business" ? (
                    <Wallet size={18} />
                  ) : (
                    <Buildings size={18} />
                  )}
                  {mode === "business" ? "Minha assinatura" : "Meu negócio"}
                </Link>
              )}
              {mode === "business" && (
                <Link href="/agendamentos">
                  <Users size={18} />
                  Meus agendamentos
                </Link>
              )}
            </nav>
            <div className="internal-sidebar-bottom">
              {plan ? (
                <div className="plan-mini">
                  <span className="grid size-10 shrink-0 place-items-center">
                    <img
                      src={
                        plan === "multi"
                          ? "/brand/subscription/pro_plan.svg"
                          : "/brand/subscription/essential_plan.svg"
                      }
                      alt=""
                      aria-hidden="true"
                      className="size-8 object-contain"
                    />
                  </span>
                  <div>
                    <small>SEU PLANO</small>
                    <strong>
                      {plan === "multi" ? "Flow PRO" : "Flow Essencial"}
                    </strong>
                  </div>
                </div>
              ) : (
                <Link
                  href="/#planos"
                  className="group relative isolate mb-5 block overflow-hidden rounded-2xl border border-[#e8e5f6] bg-[#F5F4FF] p-4 transition-colors hover:border-[#635BFF]/40"
                >
                  <img
                    src="/brand/icon.svg"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-5 -bottom-4 -z-10 w-28 opacity-[0.07]"
                  />
                  <span className="text-[9px] font-semibold tracking-widest text-[#635BFF] uppercase">
                    Flow para negócios
                  </span>
                  <strong className="mt-2 block text-sm text-zinc-900">
                    Sua agenda merece Flow.
                  </strong>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                    Crie sua página e organize seus serviços, equipe e
                    agendamentos.
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#635BFF]">
                    Conhecer os planos{" "}
                    <AnimatedArrow
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </Link>
              )}
              <div className="internal-profile [&>div:last-child]:gap-0.5! [&_strong]:leading-tight [&_small]:leading-tight">
                <AccountMenu businessAccess={!!plan} />
                <div>
                  <strong>{user?.firstName ?? "Sua conta"}</strong>
                  <small>{user?.primaryEmailAddress?.emailAddress}</small>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>
      <div className="internal-stage" inert={mobile ? true : undefined}>
        <header className="internal-topbar h-auto! min-h-[61px] flex-wrap py-3 sm:min-h-[73px]">
          <div>
            <button
              className="internal-icon mobile-only"
              ref={menuButton}
              onClick={() => setMobile(true)}
              aria-label="Abrir menu"
            >
              <Menu size={19} />
            </button>
            {mode === "business" && (
              <Link href="/agendamentos" className="public-page-link group shrink-0 whitespace-nowrap focus-visible:text-[#635BFF]">
                <ArrowLeftIcon size={15} aria-hidden="true" className="shrink-0 transition-[transform,color] duration-200 group-hover:-translate-x-1 group-hover:text-[#635BFF]! group-focus-visible:-translate-x-1 group-focus-visible:text-[#635BFF]! motion-reduce:transform-none motion-reduce:transition-none" />
                Voltar para meu espaço
              </Link>
            )}
            <span className="topbar-root">
              {mode === "business" ? "Meu negócio" : "Minha área"}
            </span>
            <ChevronRight size={13} />
            <strong className="max-w-40 truncate sm:max-w-none">
              {activeLabel}
            </strong>
          </div>
          <div className="min-w-0 flex-wrap justify-end">
            <NotificationsDrawer />

            <span className="workspace-status">
              <i />
              Tudo no seu tempo
            </span>
            {mode === "business" && current ? (
              <Link
                className="public-page-link group focus-visible:text-[#635BFF]"
                href={
                  current.published === false
                    ? panelHref("/painel/configuracao", current.id)
                    : `/${current.slug}`
                }
                target={current.published === false ? undefined : "_blank"}
              >
                {current.published === false
                  ? "Concluir configuração"
                  : "Ver minha página"}
                <ArrowUpRightIcon size={15} aria-hidden="true" className="shrink-0 transition-[transform,color] duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[#635BFF]! group-focus-visible:translate-x-1 group-focus-visible:-translate-y-1 group-focus-visible:text-[#635BFF]! motion-reduce:transform-none motion-reduce:transition-none" />
              </Link>
            ) : (
              <Link className="public-page-link" href="/explorar">
                Explorar
                <AnimatedArrow size={15} />
              </Link>
            )}
          </div>
        </header>
        <Container
          as="main"
          className="internal-content max-w-none px-4 pb-6 sm:px-6 lg:px-9"
        >
          {children}
        </Container>
      </div>
    </div>
  );
}
