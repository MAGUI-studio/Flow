"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRightIcon as ArrowRight,
  CheckIcon as Check,
  CursorIcon as MousePointer2,
} from "@phosphor-icons/react";
import {
  BookingServiceOption,
  bookingServiceOptionStyle,
} from "./booking-service-option";
import type { BusinessProfile } from "@/lib/catalog";
import type { Slot } from "@/lib/availability";
import { money, hourLabel } from "@/lib/format";
import { DateRail } from "./ui/date-rail";

export function HeroBookingPreview({
  business,
}: {
  business: BusinessProfile | null;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(0);
  const scene = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 180, y: 110 });
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const [availability, setAvailability] = useState<{
    dates: string[];
    slots: Slot[];
  }>({ dates: [], slots: [] });
  const paidServices =
    business?.services.filter((item) => item.priceCents > 0) ?? [];
  const service =
    paidServices.find((service) => service.professionalIds.length >= 2) ??
    paidServices.find((service) => service.professionalIds.length > 0);
  const services = paidServices
    .filter((item) => item.id !== service?.id)
    .slice(0, 3);
  const serviceOptions = service
    ? [services[0], service, services[1], services[2]].filter(
        (item) => item !== undefined,
      )
    : [];
  const professionals =
    business?.professionals
      .filter((professional) =>
        service?.professionalIds.includes(professional.id),
      )
      .slice(0, 3) ?? [];
  const professional = professionals[1] ?? professionals[0];
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (root.current) observer.observe(root.current);
    return () => {
      preference.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!service || !professional) return;
    const abort = new AbortController();
    const params = new URLSearchParams({
      serviceId: service.id,
      professionalId: professional.id,
    });
    async function load() {
      try {
        const response = await fetch(`/api/availability?${params}`, {
          signal: abort.signal,
        });
        if (!response.ok) return;
        const initial = await response.json();
        if (!initial.dates?.length) return;
        let chosenDate = initial.dates[0];
        let slots: Slot[] = [];
        // Prefer a fuller day rather than today's final available appointment.
        for (const date of initial.dates.slice(0, 5)) {
          params.set("date", date);
          const response = await fetch(`/api/availability?${params}`, {
            signal: abort.signal,
          });
          if (!response.ok) continue;
          const data = await response.json();
          if (data.slots.length > slots.length) {
            slots = data.slots;
            chosenDate = date;
          }
          if (slots.length >= 8) break;
        }
        setAvailability({
          dates: initial.dates
            .filter((date: string) => date >= chosenDate)
            .slice(0, 5),
          slots,
        });
      } catch {
        /* Keep the service preview available when availability cannot load. */
      }
    }
    void load();
    return () => abort.abort();
  }, [service?.id, professional?.id]);
  const step = frame < 4 ? 0 : frame < 8 ? 1 : frame < 14 ? 2 : 3;
  const selected =
    step === 0 ? frame >= 1 : step === 1 ? frame >= 5 : frame >= 9;
  const done = frame === 17;
  const clicking = [1, 3, 5, 7, 9, 11, 13, 16].includes(frame);
  const target =
    step < 2
      ? frame % 4 < 2
        ? "[data-demo-choice]"
        : "[data-demo-next]"
      : step === 2
        ? frame < 10
          ? ".date-rail-day"
          : frame < 12
            ? ".slot-grid button"
            : "[data-demo-next]"
        : "[data-demo-next]";
  useEffect(() => {
    if (reduced || !visible || !availability.slots.length) return;
    const timer = setTimeout(
      () => {
        if (!document.hidden) setFrame((current) => (current + 1) % 18);
      },
      done ? 2300 : clicking ? 280 : frame === 14 ? 650 : 800,
    );
    const resume = () => {
      if (!document.hidden) setFrame((current) => (current + 1) % 18);
    };
    document.addEventListener("visibilitychange", resume);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [frame, reduced, visible, availability.slots.length, clicking, done]);
  useLayoutEffect(() => {
    const element = scene.current;
    if (!element) return;
    const measure = () => {
      const destination = element.querySelector<HTMLElement>(target);
      if (!destination) return;
      // Offset coordinates stay in the card's local space, including its rotation.
      let x = destination.offsetWidth * 0.6 - 3,
        y = destination.offsetHeight * 0.55 - 3;
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
  }, [target, availability]);
  useEffect(() => {
    if (reduced) return;
    scene.current?.querySelector("[data-demo-content]")?.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 280, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  }, [step, reduced, done]);
  const slot = availability.slots[0];
  return (
    <div ref={root} className="hero-art" aria-label="Como agendar com o Flow">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rotate-[-22deg] scale-95 rounded-full border border-[#e8e5f6]"
      >
        <div className="absolute inset-8 rounded-full border border-[#e8e5f6]/70" />
      </div>
      <div className="absolute -top-1 right-2 z-20 flex rotate-3 items-center gap-3 rounded-2xl border border-[#e8e5f6] bg-white px-4 py-3 shadow-[0_8px_24px_#3023650a]">
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
      <div className="absolute bottom-3 left-0 z-20 flex rotate-[-3deg] items-center gap-3 rounded-2xl border border-[#e8e5f6] bg-white px-4 py-3 shadow-[0_8px_24px_#3023650a] sm:-left-3 sm:bottom-5">
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-xl bg-[#F5F4FF] text-[#635BFF]"
        >
          <Check size={16} />
        </span>
        <div>
          <span className="block text-[8px] font-medium tracking-[0.15em] text-zinc-400 uppercase">
            Mais tempo para você
          </span>
          <p className="mt-1 text-xs font-medium text-zinc-700">
            Seu horário, sem complicar.
          </p>
        </div>
      </div>
      <div className="relative z-10 mx-3 mt-7 rotate-[-5deg] rounded-2xl border border-[#e8e5f6] bg-white p-5 shadow-[0_24px_50px_#5c4c9020] sm:mx-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <span className="text-[9px] tracking-widest text-zinc-400 uppercase">
              Agende com o Flow
            </span>
            <p className="mt-1 text-sm font-semibold">
              {business?.name ?? "Seu próximo momento"}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="text-xs tracking-widest text-zinc-300"
          >
            •••
          </span>
        </div>
        <div
          ref={scene}
          className="pointer-events-none relative flex h-[520px] min-h-[520px] flex-col select-none"
          inert
        >
          {!done && (
            <>
              <div className="progress">
                {[0, 1, 2, 3].map((value) => (
                  <span key={value} className={value <= step ? "active" : ""} />
                ))}
              </div>
              <div className="text-[9px] font-semibold tracking-widest text-[#635BFF]">
                PASSO {step + 1} DE 4
              </div>
            </>
          )}
          <div data-demo-content className="min-h-0 flex-1 overflow-hidden">
            {done ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-6 grid size-20 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={38} weight="regular" />
                </span>
                <span className="text-[9px] font-semibold tracking-widest text-[#635BFF] uppercase">
                  Tudo certo!
                </span>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                  Agendamento confirmado!
                </h2>
                <p className="mt-3 max-w-64 text-xs leading-relaxed text-zinc-500">
                  Seu horário está reservado. Agora é só aproveitar seu momento.
                </p>
                <div className="mt-7 w-full rounded-xl border border-[#e8e5f6] bg-[#F5F4FF] p-4 text-xs">
                  <strong className="block">{service?.name}</strong>
                  <p className="mt-2 text-zinc-500">
                    {professional?.name} ·{" "}
                    {availability.dates[0]?.split("-").reverse().join("/")} às{" "}
                    {slot && hourLabel(slot.startsAt, business!.timezone)}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h2 className="mt-3 mb-5 text-lg font-semibold leading-tight tracking-tight">
                  {
                    [
                      "Qual cuidado você procura?",
                      "Com quem você quer agendar?",
                      "Qual é o seu melhor momento?",
                      "Confira seu agendamento",
                    ][step]
                  }
                </h2>
                {step === 0 && (
                  <>
                    <p className="mb-3 text-[10px] text-zinc-400">
                      {serviceOptions.length} serviços disponíveis
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {serviceOptions.map((option) => (
                        <div
                          key={option.id}
                          data-demo-choice={
                            option.id === service?.id ? "" : undefined
                          }
                          className={bookingServiceOptionStyle(
                            selected && option.id === service?.id,
                          )}
                        >
                          <BookingServiceOption
                            service={option}
                            selected={selected && option.id === service?.id}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {step === 1 &&
                  professionals.map((option) => (
                    <div
                      key={option.id}
                      data-demo-choice={
                        option.id === professional?.id ? "" : undefined
                      }
                      className={`choice ${selected && option.id === professional?.id ? "active" : ""}`}
                    >
                      <strong>{option.name}</strong>
                      <span>↗</span>
                    </div>
                  ))}
                {step === 2 && (
                  <>
                    <DateRail
                      dates={availability.dates}
                      value={selected ? availability.dates[0] : ""}
                      loading={false}
                      onChange={() => {}}
                    />
                    <div
                      className={`slot-grid mt-4 transition-opacity duration-300 ${selected ? "opacity-100" : "invisible opacity-0"}`}
                    >
                      {availability.slots.slice(0, 8).map((time, index) => (
                        <button
                          type="button"
                          key={time.startsAt}
                          className={frame >= 11 && index === 0 ? "active" : ""}
                        >
                          {hourLabel(time.startsAt, business!.timezone)}
                          {service?.kind === "collective" && (
                            <small>{time.remaining} vagas</small>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {step === 3 && (
                  <div className="text-xs">
                    {[
                      ["Serviço", service?.name],
                      ["Profissional", professional?.name],
                      [
                        "Data",
                        availability.dates[0]?.split("-").reverse().join("/"),
                      ],
                      [
                        "Horário",
                        slot && hourLabel(slot.startsAt, business!.timezone),
                      ],
                      [
                        "Valor do serviço",
                        service && money(service.priceCents),
                      ],
                    ].map(([label, value]) => (
                      <div
                        className="flex justify-between gap-4 border-b border-zinc-100 py-3"
                        key={label}
                      >
                        <span className="text-zinc-500">{label}</span>
                        <strong className="text-right">{value}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {!done && (
            <div className="mt-4 flex shrink-0 border-t border-[#e8e5f6] pt-4">
              <span
                data-demo-next
                className={`inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-xs font-medium text-white transition-colors duration-500 ${done ? "bg-emerald-600" : "bg-[#635BFF]"}`}
              >
                {done ? (
                  <>
                    <Check size={15} />{" "}
                    {business?.approvalMode === "manual"
                      ? "Aguardando aprovação"
                      : "Horário confirmado!"}
                  </>
                ) : (
                  <>
                    {step === 3 ? "Confirmar agendamento" : "Continuar"}
                    <ArrowRight size={15} />
                  </>
                )}
              </span>
            </div>
          )}
          {!reduced && !done && (
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 z-20 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
              style={{
                transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
              }}
            >
              {clicking && (
                <span
                  key={frame}
                  className="absolute -top-3 -left-3 size-7 animate-ping rounded-full border-2 border-[#635BFF]/40 bg-[#635BFF]/10"
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
    </div>
  );
}
