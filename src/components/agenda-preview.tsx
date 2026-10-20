"use client";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CheckIcon as Check,
  CursorIcon as MousePointer2,
  CalendarDotsIcon as CalendarDays,
  UsersIcon as Users,
  ScissorsIcon as Scissors,
  ClockIcon as Clock,
  PlusIcon as Plus,
} from "@phosphor-icons/react";
import { businessNavigation } from "@/lib/navigation";
import { NavigationIndicator } from "./ui/navigation-indicator";
import { dayKey, hourLabel } from "@/lib/format";
import type { BusinessProfile } from "@/lib/catalog";
import { ProfessionalsTable } from "./internal/professionals-table";
import { ServicesTable } from "./internal/services-table";
import { EntityListFilters } from "./internal/entity-list-filters";
import { AgendaViews } from "./internal/agenda-views";
import { HeartIcon, WalletIcon, CaretDownIcon } from "@phosphor-icons/react";
import { BookingActionControls } from "./internal/booking-action-controls";
import { PageHeading, StatusPill, SectionCard } from "./internal/primitives";
import { ListFilters } from "./internal/filters";
import { ArrowLink } from "./ui/arrow-link";
const stages = [
  {
    name: "Visão geral",
    path: "/painel",
    title: "Seu negócio inteiro. Em um só olhar.",
    description:
      "Acompanhe o movimento da agenda e saiba o que precisa da sua atenção.",
  },
  {
    name: "Equipe",
    path: "/painel/profissionais",
    title: "Quem faz acontecer, bem organizado.",
    description:
      "Reúna seus profissionais, vincule os serviços e organize os horários de cada pessoa.",
  },
  {
    name: "Serviços",
    path: "/painel/servicos",
    title: "Seu talento merece uma boa apresentação.",
    description:
      "Duração, valor, modalidade e profissionais. Cada serviço com tudo no lugar.",
  },
  {
    name: "Agenda",
    path: "/painel/agenda",
    title: "Cada reserva, sob seu controle.",
    description:
      "Confira as solicitações e aprove um agendamento sem sair da sua agenda.",
  },
];
export function AgendaPreview({
  business,
}: {
  business: BusinessProfile | null;
}) {
  const root = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(0.8);
  const [frame, setFrame] = useState(0);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [cursor, setCursor] = useState({ x: 65, y: 170 });
  const service = business?.services.find(
    (service) => service.professionalIds.length > 0,
  );
  const professional = business?.professionals.find((professional) =>
    service?.professionalIds.includes(professional.id),
  );
  const stage = frame < 3 ? 0 : frame < 6 ? 1 : frame < 9 ? 2 : 3;
  const approved = frame >= 13;
  const clicking = [2, 5, 8, 11, 15, 18, 21, 24].includes(frame);
  const agendaView =
    frame < 16
      ? "table"
      : frame < 19
        ? "day"
        : frame < 22
          ? "month"
          : "timeline";
  const target =
    frame < 3
      ? '[data-nav="/painel/profissionais"]'
      : frame < 6
        ? '[data-nav="/painel/servicos"]'
        : frame < 9
          ? '[data-nav="/painel/agenda"]'
          : frame < 14
            ? "[data-approve]"
            : frame < 17
              ? '[role="tab"][id="agenda-tab-day"]'
              : frame < 20
                ? '[role="tab"][id="agenda-tab-month"]'
                : frame < 23
                  ? '[role="tab"][id="agenda-tab-timeline"]'
                  : '[data-nav="/painel"]';
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    const resize = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / 1080),
    );
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (root.current) {
      resize.observe(root.current);
      observer.observe(root.current);
    }
    return () => {
      resize.disconnect();
      observer.disconnect();
      preference.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    if (!service || !professional) return;
    const abort = new AbortController();
    const params = new URLSearchParams({
      serviceId: service.id,
      professionalId: professional.id,
    });
    void (async () => {
      try {
        const response = await fetch(`/api/availability?${params}`, {
          signal: abort.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!data.dates?.[0]) return;
        params.set("date", data.dates[0]);
        const timesResponse = await fetch(`/api/availability?${params}`, {
          signal: abort.signal,
        });
        if (!timesResponse.ok) return;
        const times = await timesResponse.json();
        if (times.slots?.[0]) setStartsAt(times.slots[0].startsAt);
      } catch {}
    })();
    return () => abort.abort();
  }, [service?.id, professional?.id]);
  useEffect(() => {
    if (reduced || !visible || (stage === 3 && !startsAt)) return;
    const hold = [0, 3, 6, 9, 13, 16, 19, 22].includes(frame);
    const timer = setTimeout(
      () => {
        if (!document.hidden) setFrame((frame) => (frame + 1) % 25);
      },
      clicking ? 260 : hold ? 1550 : frame === 12 ? 900 : 850,
    );
    const resume = () => {
      if (!document.hidden) setFrame(0);
    };
    document.addEventListener("visibilitychange", resume);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [frame, reduced, visible, stage, startsAt]);
  useLayoutEffect(() => {
    if ([0, 3, 6, 9, 13].includes(frame)) return;
    const element = scene.current;
    if (!element) return;
    const measure = () => {
      const destination = element.querySelector<HTMLElement>(target);
      if (!destination) return;
      let x = destination.offsetWidth * 0.55 - 3,
        y = destination.offsetHeight * 0.5 - 3;
      let parent: HTMLElement | null = destination;
      while (parent && parent !== element) {
        x += parent.offsetLeft;
        y += parent.offsetTop;
        parent = parent.offsetParent as HTMLElement | null;
      }
      setCursor({ x, y });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [target, stage, startsAt, frame]);
  useEffect(() => {
    if (reduced) return;
    for (const element of [copy.current, content.current])
      element?.animate(
        [
          { opacity: 0, transform: "translateY(9px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" },
      );
  }, [stage, reduced]);
  const noop = () => {};
  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-3xl text-center">
        <span className="text-[10px] font-semibold tracking-[.18em] text-[#635BFF] uppercase">
          FLOW PARA SEU NEGÓCIO
        </span>
        <div
          ref={copy}
          className="flex min-h-56 flex-col justify-center sm:min-h-44"
        >
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {stages[stage].title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-500">
            {stages[stage].description}
          </p>
        </div>
        <ol
          aria-label="Conheça a gestão do seu negócio"
          className="mt-7 mb-9 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
        >
          {stages.map((item, index) => (
            <li
              key={item.name}
              aria-current={index === stage ? "step" : undefined}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] transition-colors duration-300 sm:text-xs ${index === stage ? "border-[#635BFF] bg-[#635BFF] text-white" : "border-[#e8e5f6] bg-white/70 text-zinc-400"}`}
            >
              <span className="opacity-60">0{index + 1}</span>
              {item.name}
            </li>
          ))}
        </ol>
      </div>
      <div
        ref={root}
        className="relative w-full overflow-hidden rounded-2xl border border-[#e8e5f6] bg-white shadow-[0_20px_60px_#635BFF0a]"
        style={{ height: 690 * scale }}
        aria-hidden="true"
      >
        <div
          ref={scene}
          className="internal-app pointer-events-none absolute top-0 left-0 min-h-0 w-[1080px] origin-top-left select-none overflow-hidden text-left"
          inert
          style={{ transform: `scale(${scale})`, height: 690 }}
        >
          <div className="flex h-11 items-center gap-1.5 border-b border-zinc-200 bg-white px-5">
            <span className="size-2 rounded-full bg-zinc-200" />
            <span className="size-2 rounded-full bg-zinc-200" />
            <span className="size-2 rounded-full bg-zinc-200" />
            <span className="mx-auto rounded-md bg-zinc-50 px-10 py-1 text-[10px] text-zinc-400">
              Flow · {stages[stage].name}
            </span>
            <span className="w-8" />
          </div>
          <div className="grid h-[646px] grid-cols-[210px_1fr]">
            <aside className="border-r border-[#e9e9f1] bg-white p-5">
              <img src="/brand/logo_black.svg" alt="" className="mb-6 w-20" />
              <span className="nav-caption mb-2">SEU ESTABELECIMENTO</span>
              <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#e9e9f1] bg-white p-3 text-xs font-medium">
                <span>{business?.name}</span>
                <CaretDownIcon size={14} />
              </div>
              <nav
                ref={navigationRef}
                className="internal-navigation relative mt-3 p-0 [&>a]:pr-7"
              >
                <NavigationIndicator
                  containerRef={navigationRef}
                  activeKey={stages[stage].path}
                  followClicks={false}
                />
                {businessNavigation.map((item, index) => (
                  <Fragment key={item.href}>
                    {item.group &&
                      item.group !== businessNavigation[index - 1]?.group && (
                        <span className="nav-caption mt-4 mb-1 uppercase">
                          {item.group}
                        </span>
                      )}
                    <a
                      href="#"
                      data-nav={item.href}
                      key={item.href}
                      aria-current={
                        item.href === stages[stage].path ? "page" : undefined
                      }
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </a>
                  </Fragment>
                ))}
                <a href="#">
                  <HeartIcon size={18} />
                  <span>Meus favoritos</span>
                </a>
                <span className="nav-caption secondary">NEGÓCIO</span>
                <a href="#">
                  <WalletIcon size={18} />
                  <span>Minha assinatura</span>
                </a>
              </nav>
            </aside>
            <div className="min-w-0 overflow-hidden">
              <header className="internal-topbar">
                <div>
                  <span className="topbar-root">Meu negócio</span>
                  <span className="text-zinc-400">›</span>
                  <strong>
                    {stages[stage].name === "Equipe"
                      ? "Quem faz acontecer."
                      : stages[stage].name}
                  </strong>
                </div>
                <div>
                  <span className="workspace-status">
                    <i />
                    Tudo no seu tempo
                  </span>
                  <span className="public-page-link">Ver minha página →</span>
                </div>
              </header>
              <div className="overflow-hidden p-7" ref={content}>
                {stage === 0 && (
                  <>
                    <PageHeading
                      eyebrow={new Date().toLocaleDateString("pt-BR", {
                        timeZone: business?.timezone ?? "America/Sao_Paulo",
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      title="Tudo flui por aqui."
                      description={`Um novo dia para cuidar de ${business?.name}. Veja o que está acontecendo.`}
                      action={
                        <span className="button">
                          <Plus size={16} />
                          Abrir horários
                        </span>
                      }
                    />
                    <div className="overview-metrics">
                      {[
                        {
                          label: "Agendamentos hoje",
                          value:
                            startsAt &&
                            business &&
                            dayKey(startsAt, business.timezone) ===
                              dayKey(new Date(), business.timezone)
                              ? "1"
                              : "0",
                          icon: CalendarDays,
                        },
                        {
                          label: "Aguardando aprovação",
                          value: startsAt ? "1" : "0",
                          icon: Clock,
                        },
                        {
                          label: "Profissionais ativos",
                          value: String(business?.professionals.length ?? 0),
                          icon: Users,
                        },
                        {
                          label: "Serviços disponíveis",
                          value: String(business?.services.length ?? 0),
                          icon: Scissors,
                        },
                      ].map((metric, index) => (
                        <div
                          key={metric.label}
                          className="metric-card relative isolate overflow-hidden"
                        >
                          <div>
                            <span>{metric.label}</span>
                            <i
                              aria-hidden="true"
                              className="pointer-events-none absolute -right-3 -bottom-5 -z-10 rotate-[-12deg] bg-transparent p-0 opacity-10"
                            >
                              <metric.icon className="size-28" weight="light" />
                            </i>
                          </div>
                          <strong>{metric.value.padStart(2, "0")}</strong>
                          <small>
                            {
                              [
                                "No horário do seu estabelecimento",
                                "Seus clientes estão esperando",
                                "Até 20 no seu estabelecimento",
                                "Seu talento em cada atendimento",
                              ][index]
                            }
                          </small>
                        </div>
                      ))}
                    </div>
                    <div className="overview-columns items-stretch">
                      <SectionCard
                        title="Próximos encontros"
                        description="Os momentos que estão chegando."
                        aside={
                          <span className="subtle-link">Ver agenda →</span>
                        }
                      >
                        <div className="upcoming-row">
                          <div className="upcoming-time">
                            <strong>
                              {startsAt &&
                                hourLabel(startsAt, business!.timezone)}
                            </strong>
                            <small>
                              {startsAt &&
                                new Date(startsAt).toLocaleDateString("pt-BR", {
                                  timeZone: business!.timezone,
                                  day: "2-digit",
                                  month: "short",
                                })}
                            </small>
                          </div>
                          <div>
                            <strong>{service?.name}</strong>
                            <small>{professional?.name}</small>
                          </div>
                          <StatusPill
                            status="pending"
                            label="Aguardando aprovação"
                          />
                        </div>
                      </SectionCard>
                      <SectionCard
                        title="Tudo pronto para fluir?"
                        description="Complete estas etapas para começar a receber agendamentos."
                      >
                        {[
                          "Apresente sua equipe",
                          "Cadastre seus serviços",
                          "Configure os horários da equipe",
                        ].map((title) => (
                          <div className="setup-step" key={title}>
                            <span className="done">
                              <Check size={13} />
                            </span>
                            {title}
                          </div>
                        ))}
                      </SectionCard>
                    </div>
                  </>
                )}
                {stage === 1 && (
                  <>
                    <PageHeading
                      eyebrow={business?.name}
                      title="Quem faz acontecer."
                      description="Sua equipe, seus talentos e as pessoas por trás de cada atendimento."
                      action={
                        <span className="button">
                          <Plus size={16} />
                          Adicionar profissional
                        </span>
                      }
                    />
                    <EntityListFilters
                      kind="professionals"
                      options={business?.services ?? []}
                      count={business?.professionals.length ?? 0}
                      total={business?.professionals.length ?? 0}
                    />
                    {business && (
                      <ProfessionalsTable
                        establishmentId={business.id}
                        timezone={business.timezone}
                        now={new Date().toISOString()}
                        rows={business.professionals.map((person) => ({
                          ...person,
                          active: true,
                          photo: person.photoUrl
                            ? { url: person.photoUrl }
                            : null,
                          vacationStartsAt: null,
                          vacationEndsAt: null,
                          services: business.services
                            .filter((item) =>
                              item.professionalIds.includes(person.id),
                            )
                            .map((item) => ({
                              serviceId: item.id,
                              service: item,
                            })),
                        }))}
                      />
                    )}
                  </>
                )}
                {stage === 2 && (
                  <>
                    <PageHeading
                      eyebrow={business?.name}
                      title="Seu talento, em serviços."
                      description="Organize o que você oferece e facilite a escolha dos seus clientes."
                      action={
                        <span className="button">
                          <Plus size={16} />
                          Novo serviço
                        </span>
                      }
                    />
                    <EntityListFilters
                      kind="services"
                      options={business?.professionals ?? []}
                      count={business?.services.length ?? 0}
                      total={business?.services.length ?? 0}
                    />
                    {business && (
                      <ServicesTable
                        establishmentId={business.id}
                        rows={business.services.map((item) => ({
                          ...item,
                          professionals: business.professionals
                            .filter((person) =>
                              item.professionalIds.includes(person.id),
                            )
                            .map((person) => ({
                              professional: { name: person.name },
                            })),
                        }))}
                      />
                    )}
                  </>
                )}
                {stage === 3 && (
                  <>
                    <PageHeading
                      eyebrow={business?.name}
                      title="Agenda"
                      description="Cada horário, cada cliente, cada próximo encontro. Tudo em um só lugar."
                      action={
                        <span className="button secondary">
                          <Plus size={16} />
                          Abrir horários
                        </span>
                      }
                    />
                    <ListFilters
                      preview
                      placeholder="Buscar serviço ou profissional"
                      statuses
                      period
                      professionals={business?.professionals}
                    />
                    <div className="section-subline">
                      <span>
                        {startsAt ? "1 agendamento" : "Nenhum agendamento"}
                      </span>
                      <span>Fuso: {business?.timezone}</span>
                    </div>
                    {service && professional && startsAt && (
                      <AgendaViews
                        preview
                        previewView={agendaView}
                        previewDate={dayKey(startsAt, business!.timezone)}
                        timezone={business!.timezone}
                        rows={[
                          {
                            id: "preview-appointment",
                            effectiveStatus: approved ? "confirmed" : "pending",
                            durationMinutes: service.durationMinutes,
                            priceCents: service.priceCents,
                            whatsapp: null,
                            session: {
                              startsAt: new Date(startsAt),
                              service: { name: service.name },
                              professional: { name: professional.name },
                            },
                            actions: (
                              <div className="appointment-actions flex-nowrap self-center [&>button]:my-0 [&>button]:h-9 [&>button]:min-h-9 [&>button]:py-0">
                                <BookingActionControls
                                  status={approved ? "confirmed" : "pending"}
                                  busy={frame === 12 ? "approve" : ""}
                                  onAction={noop}
                                  onConfirm={noop}
                                />
                              </div>
                            ),
                          },
                        ]}
                      />
                    )}
                    <div
                      className={`mt-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-700 transition-all duration-300 ${approved ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                    >
                      <Check size={16} />
                      Agendamento aprovado. Sua agenda está atualizada.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {!reduced && (
            <div
              className={`absolute top-0 left-0 z-20 transition-[transform,opacity] duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${[0, 3, 6, 9, 13, 14].includes(frame) ? "opacity-0" : "opacity-100"}`}
              style={{ transform: `translate(${cursor.x}px,${cursor.y}px)` }}
            >
              {clicking && (
                <span
                  key={frame}
                  className="absolute -top-3 -left-3 size-7 animate-ping rounded-full border-2 border-[#635BFF]/40"
                />
              )}
              <MousePointer2
                size={24}
                weight="fill"
                className={`origin-top-left text-black drop-shadow-sm transition-transform duration-150 ${clicking ? "scale-85" : "scale-100"}`}
              />
            </div>
          )}
        </div>
      </div>
      <div className="mt-8 mb-3 flex justify-center">
        <ArrowLink href="/#planos">Conheça os planos do Flow</ArrowLink>
      </div>
    </div>
  );
}
