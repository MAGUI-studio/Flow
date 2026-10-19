"use client";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Check,
  MousePointer2,
  CalendarDays,
  Users,
  Scissors,
  Clock,
  Layers,
  Globe,
  MapPin,
  ArrowRight,
  Plus,
} from "lucide-react";
import { businessNavigation } from "@/lib/navigation";
import { NavigationIndicator } from "./ui/navigation-indicator";
import { money, dayKey } from "@/lib/format";
import type { BusinessProfile } from "@/lib/catalog";
import { OwnerAppointment } from "./internal/owner-appointment";
import { BookingActionControls } from "./internal/booking-action-controls";
import { PageHeading, StatusPill } from "./internal/primitives";
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
  const clicking = [2, 5, 8, 11, 16].includes(frame);
  const target =
    frame < 3
      ? '[data-nav="/painel/profissionais"]'
      : frame < 6
        ? '[data-nav="/painel/servicos"]'
        : frame < 9
          ? '[data-nav="/painel/agenda"]'
          : frame < 15
            ? "[data-approve]"
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
    const hold = [0, 3, 6, 9, 13, 14].includes(frame);
    const timer = setTimeout(
      () => {
        if (!document.hidden) setFrame((frame) => (frame + 1) % 17);
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
    if (![1, 2, 4, 5, 7, 8, 10, 11, 12, 15, 16].includes(frame)) return;
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
              <div className="mb-6 rounded-xl border border-[#e9e9f1] p-3 text-xs font-medium">
                {business?.name}
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
                      className={
                        item.href === stages[stage].path ? "active" : ""
                      }
                      aria-current={
                        item.href === stages[stage].path ? "page" : undefined
                      }
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </a>
                  </Fragment>
                ))}
              </nav>
            </aside>
            <div className="overflow-hidden p-7" ref={content}>
              {stage === 0 && (
                <>
                  <PageHeading
                    eyebrow={business?.name}
                    title="Tudo flui por aqui."
                    description="Um olhar sobre a sua agenda e os próximos passos do seu negócio."
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
                        label: "Profissionais",
                        value: String(business?.professionals.length ?? 0),
                        icon: Users,
                      },
                      {
                        label: "Serviços",
                        value: String(business?.services.length ?? 0),
                        icon: Scissors,
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="metric-card relative isolate overflow-hidden"
                      >
                        <metric.icon
                          aria-hidden
                          className="absolute -right-3 -bottom-4 -z-10 size-24 stroke-1 text-[#635BFF] opacity-[0.08]"
                        />
                        <span className="text-xs text-zinc-500">
                          {metric.label}
                        </span>
                        <strong className="mt-3 block text-3xl">
                          {metric.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <section className="internal-card mt-6">
                    <div className="internal-card-heading">
                      <h2>Próximos agendamentos</h2>
                      <span className="text-xs text-[#635BFF]">
                        Ver agenda →
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-6 pb-6">
                      <div>
                        <strong className="text-sm">{service?.name}</strong>
                        <p className="mt-2 text-xs text-zinc-400">
                          Com {professional?.name}
                        </p>
                      </div>
                      <StatusPill
                        status="pending"
                        label="Aguardando aprovação"
                      />
                    </div>
                  </section>
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
                  <ListFilters
                    preview
                    placeholder="Buscar profissional pelo nome"
                  />
                  <div className="section-subline">
                    <span>{business?.professionals.length} profissionais</span>
                    <span>Estabelecimento: {business?.name}</span>
                  </div>
                  <div className="professional-grid">
                    {business?.professionals.slice(0, 3).map((person) => {
                      const services = business.services.filter((service) =>
                        service.professionalIds.includes(person.id),
                      );
                      return (
                        <article key={person.id} className="professional-card">
                          <div className="professional-card-top">
                            <span className="professional-avatar">
                              {person.name
                                .split(" ")
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join("")}
                            </span>
                            <StatusPill status="confirmed" label="Ativo" />
                          </div>
                          <h2>{person.name}</h2>
                          <p>{services.length} serviços vinculados</p>
                          <div className="service-chips">
                            {services.slice(0, 3).map((service) => (
                              <span key={service.id}>{service.name}</span>
                            ))}
                          </div>
                          <div className="professional-card-footer">
                            Organizar horários
                            <ArrowRight size={15} />
                          </div>
                        </article>
                      );
                    })}
                  </div>
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
                  <ListFilters preview placeholder="Buscar serviço" />
                  <div className="section-subline">
                    <span>{business?.services.length} serviços</span>
                    <span>Valores combinados diretamente com o cliente</span>
                  </div>
                  <div className="service-list">
                    {business?.services.slice(0, 3).map((item) => (
                      <article key={item.id} className="service-list-card">
                        <span className="service-list-icon">
                          {item.kind === "collective" ? (
                            <Layers size={21} />
                          ) : (
                            <Scissors size={21} />
                          )}
                        </span>
                        <div className="service-list-main">
                          <h2>{item.name}</h2>
                          <div>
                            <span>
                              <Clock size={12} />
                              {item.durationMinutes} min
                            </span>
                            <span>
                              {item.kind === "collective"
                                ? "Em grupo"
                                : "Individual"}
                            </span>
                            <span>
                              {item.modality === "online" ? (
                                <Globe size={12} />
                              ) : (
                                <MapPin size={12} />
                              )}{" "}
                              {item.modality === "online"
                                ? "Online"
                                : "Presencial"}
                            </span>
                          </div>
                          <p>
                            {business.professionals
                              .filter((person) =>
                                item.professionalIds.includes(person.id),
                              )
                              .map((person) => person.name)
                              .join(" · ")}
                          </p>
                        </div>
                        <div className="service-list-price">
                          <strong>{money(item.priceCents)}</strong>
                          <small>por atendimento</small>
                        </div>
                      </article>
                    ))}
                  </div>
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
                    <OwnerAppointment
                      startsAt={startsAt}
                      timezone={business!.timezone}
                      service={service.name}
                      professional={professional.name}
                      durationMinutes={service.durationMinutes}
                      priceCents={service.priceCents}
                      status={approved ? "confirmed" : "pending"}
                      actions={
                        <div className="appointment-actions flex-nowrap self-center [&>button]:my-0 [&>button]:h-9 [&>button]:min-h-9 [&>button]:py-0">
                          <BookingActionControls
                            status={approved ? "confirmed" : "pending"}
                            busy={frame === 12 ? "approve" : ""}
                            onAction={noop}
                            onConfirm={noop}
                          />
                        </div>
                      }
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
                fill="white"
                className={`origin-top-left text-zinc-800 drop-shadow-sm transition-transform duration-150 ${clicking ? "scale-85" : "scale-100"}`}
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
