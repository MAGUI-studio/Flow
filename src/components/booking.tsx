"use client";
import { FormSubmitGuard } from "@/components/ui/form-feedback";
import {
  BookingServiceOption,
  bookingServiceOptionStyle,
} from "./booking-service-option";
import { authModalAppearance } from "@/lib/auth-modal-appearance";
import {
  isEstablishmentOwner,
  ownEstablishmentBookingMessage,
} from "@/lib/booking-policy";
import { useToastError } from "@/components/ui/flow-toaster";
import { formValidation } from "@/lib/form-validation";
import { AnimatedArrow } from "@/components/ui/animated-arrow";
import { Container } from "@/components/container";
import { ScrollArea } from "@/components/ui/scrollArea";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema } from "@/lib/form-schemas";
import { phoneMask } from "@/lib/masks";
import { useQueryState, parseAsString } from "nuqs";
import Link from "next/link";
import { LocationMap } from "./ui/location-map";
import { ArrowSquareOutIcon, NavigationArrowIcon } from "@phosphor-icons/react";
import { BusinessProfileHero } from "./business-profile-hero";
import { UpcomingBookingNotice } from "./upcoming-booking-notice";
import { DateRail } from "@/components/ui/date-rail";
import { useUser, useClerk } from "@clerk/nextjs";
import { ArrowLeft, Check, CalendarDays, LoaderCircle } from "lucide-react";
import type { BusinessProfile } from "@/lib/catalog";
import type { Slot } from "@/lib/availability";
import { money, hourLabel } from "@/lib/format";
import { Header } from "./header";
import type { UpcomingBooking } from "@/lib/upcoming-bookings";
import { dayKey, statusLabel } from "@/lib/format";
export function Booking({
  business: b,
  myBookings = [],
  bookingsUserId,
  ownerUserId,
}: {
  business: BusinessProfile;
  myBookings?: UpcomingBooking[];
  bookingsUserId?: string | null;
  ownerUserId?: string | null;
}) {
  const setError = useToastError();
  const { isSignedIn, user } = useUser(),
    clerk = useClerk();
  const isOwner = isEstablishmentOwner(user?.id, ownerUserId);
  const bookingForm = useForm({
    ...formValidation,
    resolver: (values, context, options) =>
      zodResolver(
        bookingSchema(
          b.services.find((item) => item.id === values.serviceId)?.modality ===
            "online",
        ),
      )(values, context, options),
    defaultValues: {
      serviceId: "",
      professionalId: "",
      date: "",
      startsAt: "",
      phone: "",
    },
  });
  const serviceId = bookingForm.watch("serviceId");
  const professionalId = bookingForm.watch("professionalId");
  const date = bookingForm.watch("date");
  const setServiceId = (value: string) =>
    bookingForm.setValue("serviceId", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  const setProfessionalId = (value: string) =>
    bookingForm.setValue("professionalId", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  const setDate = (value: string) =>
    bookingForm.setValue("date", value, {
      shouldDirty: true,
      shouldValidate: true,
    });
  const [step, setStep] = useState(0),
    [slot, setSelectedSlot] = useState<Slot | null>(null),
    [dates, setDates] = useState<string[]>([]),
    [slots, setSlots] = useState<Slot[]>([]),
    [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [success, setSuccess] = useState<{ id: string; status: string } | null>(
      null,
    ),
    [key, setKey] = useState("");
  function setSlot(value: Slot | null) {
    setSelectedSlot(value);
    bookingForm.setValue("startsAt", value?.startsAt ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  }
  const [resolvedKey, setResolvedKey] = useState("");
  const requestKey = `${serviceId}:${professionalId}:${date}`;
  const timesReady = resolvedKey === requestKey && !loading;
  const slotArea = useRef<HTMLDivElement>(null);
  const previousContext = useRef("");
  const [slotsHeight, setSlotsHeight] = useState(0);
  useLayoutEffect(() => {
    if (date && slotArea.current) {
      const measuredHeight = slotArea.current.getBoundingClientRect().height;
      setSlotsHeight((height) => Math.max(height, measuredHeight));
    }
  }, [slots.length, date, resolvedKey]);
  const ownBookings =
    isSignedIn && user?.id === bookingsUserId ? myBookings : [];
  const bookedDates = ownBookings.map((booking) =>
    dayKey(booking.startsAt, b.timezone),
  );
  const service = b.services.find((s) => s.id === serviceId),
    professional = b.professionals.find((p) => p.id === professionalId);
  const phone = bookingForm.watch("phone");
  const setPhone = (value: string) =>
    bookingForm.setValue("phone", phoneMask(value), {
      shouldValidate: bookingForm.formState.isSubmitted,
      shouldDirty: true,
    });
  const [resume] = useQueryState("retomar", parseAsString);
  const professionals = b.professionals.filter((p) =>
    service?.professionalIds.includes(p.id),
  );
  useEffect(() => {
    if (isOwner) {
      sessionStorage.removeItem(`flow-booking-${b.id}`);
      return;
    }
    if (resume === "1") {
      const raw = sessionStorage.getItem(`flow-booking-${b.id}`);
      if (raw)
        try {
          const draft = JSON.parse(raw);
          setServiceId(draft.serviceId);
          setProfessionalId(draft.professionalId);
          setDate(draft.date);
          setSlot(draft.slot);
          setPhone(draft.phone);
          setStep(3);
        } catch {
          sessionStorage.removeItem(`flow-booking-${b.id}`);
        }
    }
  }, [b.id, resume, isOwner]);
  useEffect(() => {
    if (isOwner || !serviceId || !professionalId) return;
    const abort = new AbortController();
    setLoading(true);
    setError("");
    const context = `${serviceId}:${professionalId}`;
    if (previousContext.current !== context) {
      setDates([]);
      setSlots([]);
      setSlotsHeight(0);
      previousContext.current = context;
    }
    fetch(
      `/api/availability?${new URLSearchParams({ serviceId, professionalId, ...(date ? { date } : {}) })}`,
      { signal: abort.signal, cache: "no-store" },
    )
      .then(async (r) => {
        const data = await r.json();
        if (abort.signal.aborted) return;
        if (!r.ok) throw new Error(data.error);
        setDates(data.dates);
        setSlots(data.slots);
        setResolvedKey(requestKey);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [serviceId, professionalId, date, user?.id, isOwner]);
  function selectService(id: string) {
    setServiceId(id);
    setProfessionalId("");
    setDate("");
    setSlot(null);
    setKey("");
  }
  function back() {
    setError("");
    if (step === 3) {
      setSlot(null);
      setKey("");
    }
    if (step === 2) {
      setProfessionalId("");
      setDate("");
      setSlot(null);
    }
    if (step === 1) {
      setServiceId("");
      setProfessionalId("");
      setDate("");
      setSlot(null);
    }
    setStep(step - 1);
  }
  async function confirm() {
    await bookingForm.handleSubmit(sendReservation)();
  }
  async function sendReservation() {
    if (isOwner) {
      setError(ownEstablishmentBookingMessage);
      return;
    }
    if (!service || !professional || !slot) return;
    if (!isSignedIn) {
      sessionStorage.setItem(
        `flow-booking-${b.id}`,
        JSON.stringify({ serviceId, professionalId, date, slot, phone }),
      );
      await clerk.openSignIn({
        appearance: authModalAppearance,
        forceRedirectUrl: `${window.location.origin}/${b.slug}?retomar=1`,
      });
      return;
    }
    setSaving(true);
    setError("");
    const requestKey = key || crypto.randomUUID();
    setKey(requestKey);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          professionalId,
          startsAt: slot.startsAt,
          whatsapp: phone,
          idempotencyKey: requestKey,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSuccess(result);
      sessionStorage.removeItem(`flow-booking-${b.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível agendar.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <Header />
      <Container as="main" className="page-intro pb-4">
        <Link className="back-link" href="/#explorar">
          <ArrowLeft size={14} />
          Explorar espaços
        </Link>
        <BusinessProfileHero business={b} />
        {ownBookings.length > 0 && !success && (
          <UpcomingBookingNotice
            bookings={ownBookings}
            businessName={b.name}
            timezone={b.timezone}
          />
        )}
        {isOwner ? (
          <section className="my-8 flex flex-col items-start gap-5 rounded-2xl border border-[#e8e5f6] bg-[#f5f4ff] p-6 sm:flex-row sm:p-8">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#635BFF]">
              <CalendarDays size={21} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
                Este é o seu estabelecimento
              </h2>
              <p className="mt-2 text-sm leading-7 text-zinc-500">
                {ownEstablishmentBookingMessage} Para acompanhar os horários e
                atender seus clientes, acesse a agenda do negócio.
              </p>
              <Link
                href={`/painel/agenda?estabelecimento=${b.id}`}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#635BFF] px-5 text-sm font-semibold text-white hover:bg-[#5046E5]"
              >
                Ir para minha agenda <AnimatedArrow size={15} />
              </Link>
            </div>
          </section>
        ) : success ? (
          <section className="panel empty">
            <Check size={32} color="#635BFF" />
            <h2>
              {success.status === "pending"
                ? "Solicitação enviada!"
                : "Seu horário está confirmado!"}
            </h2>
            <p className="muted-text">
              {success.status === "pending"
                ? "O estabelecimento tem até 24 horas, ou até o início do atendimento, para responder."
                : "Tudo certo. Os detalhes estão na sua conta."}
            </p>
            <Link
              className="button"
              style={{ marginTop: 20 }}
              href="/agendamentos"
            >
              Meus agendamentos →
            </Link>
          </section>
        ) : (
          <div className="booking-grid mb-0">
            <form
              className="panel flex h-[660px] min-w-0 flex-col p-5 sm:p-6"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void confirm();
              }}
            >
              <div className="progress shrink-0">
                {[0, 1, 2, 3].map((n) => (
                  <span className={n <= step ? "active" : ""} key={n} />
                ))}
              </div>
              <div className="eyebrow" style={{ justifyContent: "flex-start" }}>
                PASSO {step + 1} DE 4
              </div>
              <h2
                className="min-h-16 shrink-0 tracking-tight"
                style={{ marginTop: 12 }}
              >
                {
                  [
                    "Qual cuidado você procura?",
                    "Com quem você quer agendar?",
                    "Qual é o seu melhor momento?",
                    "Confira seu agendamento",
                  ][step]
                }
              </h2>
              <ScrollArea
                key={step}
                role="region"
                aria-label={
                  [
                    "Selecionar serviço",
                    "Selecionar profissional",
                    "Selecionar data e horário",
                    "Confirmar agendamento",
                  ][step]
                }
                className="min-h-0 flex-1"
                viewportClassName="overscroll-auto"
              >
                <div className="pr-3 pb-2">
                  {step === 0 && (
                    <>
                      {!b.services.length && (
                        <p className="muted-text">
                          Nenhum serviço disponível para agendamento.
                        </p>
                      )}
                      {b.services.length > 0 && (
                        <>
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] leading-5 text-zinc-400">
                            <span>
                              {b.services.length}{" "}
                              {b.services.length === 1
                                ? "serviço disponível"
                                : "serviços disponíveis"}
                            </span>
                            {b.services.length > 4 && (
                              <span>Role para ver todos</span>
                            )}
                          </div>
                          <div className="mt-2">
                            <div className="grid auto-rows-fr grid-cols-1 gap-3 p-1 pr-3 sm:grid-cols-2">
                              {b.services.map((s) => (
                                <button
                                  type="button"
                                  aria-pressed={s.id === serviceId}
                                  className={bookingServiceOptionStyle(
                                    s.id === serviceId,
                                  )}
                                  key={s.id}
                                  onClick={() => selectService(s.id)}
                                >
                                  <BookingServiceOption
                                    service={s}
                                    selected={s.id === serviceId}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  {step === 1 &&
                    professionals.map((p) => (
                      <button
                        type="button"
                        className={`choice ${p.id === professionalId ? "active" : ""}`}
                        key={p.id}
                        onClick={() => {
                          setProfessionalId(p.id);
                          setDate("");
                          setSlot(null);
                        }}
                      >
                        <span className="flex items-center gap-3">
                          {p.photoUrl && (
                            <img
                              src={p.photoUrl}
                              alt=""
                              className="size-10 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <strong>{p.name}</strong>
                        </span>
                        <span>↗</span>
                      </button>
                    ))}
                  {step === 2 && (
                    <>
                      <DateRail
                        dates={[...new Set([...dates, ...bookedDates])].sort()}
                        value={date}
                        loading={loading}
                        bookedDates={bookedDates}
                        onChange={(value) => {
                          setDate(value);
                          setSlot(null);
                        }}
                      />
                      {service && (
                        <Link
                          href={`/lista-de-espera/nova?${new URLSearchParams({ servico: service.id, ...(professionalId ? { profissional: professionalId } : {}) })}`}
                          className="my-4 inline-flex text-xs font-medium text-[#635BFF] hover:underline"
                        >
                          Não encontrou um horário? Entrar na lista de espera →
                        </Link>
                      )}
                      {!dates.length && !bookedDates.length && !loading ? (
                        <p className="muted-text">
                          {service?.kind === "collective"
                            ? "Não há sessões em grupo disponíveis para este profissional no momento."
                            : "Não há horários disponíveis para este atendimento no momento. Escolha outro profissional ou consulte novamente mais tarde."}
                        </p>
                      ) : (
                        date && (
                          <>
                            <div className="slots-heading">
                              <h3>Horários disponíveis</h3>
                              <span
                                role="status"
                                className={
                                  timesReady
                                    ? "slots-status"
                                    : "slots-status fetching"
                                }
                              >
                                {!timesReady ? (
                                  <>
                                    <LoaderCircle size={13} /> Atualizando
                                    horários
                                  </>
                                ) : (
                                  `${slots.length} ${slots.length === 1 ? "horário disponível" : "horários disponíveis"}`
                                )}
                              </span>
                            </div>
                            {ownBookings
                              .filter(
                                (booking) =>
                                  dayKey(booking.startsAt, b.timezone) === date,
                              )
                              .map((booking) => (
                                <p
                                  className="selected-day-booking"
                                  key={booking.id}
                                >
                                  <CalendarDays size={14} /> Você já tem{" "}
                                  {booking.serviceName.toLowerCase()} às{" "}
                                  {hourLabel(booking.startsAt, b.timezone)} ·
                                  com {booking.professionalName} ·{" "}
                                  {statusLabel[booking.status]}
                                </p>
                              ))}
                            <div
                              ref={slotArea}
                              className="slots-area"
                              style={{ minHeight: slotsHeight || undefined }}
                              aria-busy={!timesReady}
                            >
                              <div
                                className={`slot-grid ${!timesReady ? "slots-refreshing" : ""}`}
                              >
                                {slots.map((s) => (
                                  <button
                                    type="button"
                                    key={s.startsAt}
                                    disabled={!timesReady}
                                    className={
                                      slot?.startsAt === s.startsAt
                                        ? "active"
                                        : ""
                                    }
                                    onClick={() => {
                                      setSlot(s);
                                      setKey("");
                                    }}
                                  >
                                    {hourLabel(s.startsAt, b.timezone)}
                                    {service?.kind === "collective" && (
                                      <small>{s.remaining} vagas</small>
                                    )}
                                  </button>
                                ))}
                              </div>
                              {!slots.length && timesReady && (
                                <p className="muted-text">
                                  Não há horários livres nesta data. Escolha
                                  outro dia.
                                </p>
                              )}
                              {!slots.length && !timesReady && (
                                <div className="slot-grid" aria-hidden="true">
                                  {Array.from({ length: 9 }, (_, index) => (
                                    <div
                                      className="slot-placeholder"
                                      key={index}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )
                      )}
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <p className="muted-text">
                        {b.approvalMode === "manual"
                          ? "Seu pedido será enviado para aprovação do estabelecimento."
                          : "Ao confirmar, o horário será reservado para você."}
                      </p>
                      {service?.modality === "online" && (
                        <label className="form-field">
                          Seu WhatsApp
                          <input
                            {...bookingForm.register("phone")}
                            type="tel"
                            autoComplete="tel"
                            placeholder="(11) 99999-9999"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            aria-invalid={!!bookingForm.formState.errors.phone}
                            aria-describedby="booking-phone-help booking-phone-error"
                          />
                          <small className="muted-text" id="booking-phone-help">
                            Compartilhado com o estabelecimento para organizar
                            seu atendimento online.
                          </small>
                          {bookingForm.formState.errors.phone && (
                            <small
                              id="booking-phone-error"
                              className="mt-2 block text-xs text-rose-600"
                              role="alert"
                            >
                              {bookingForm.formState.errors.phone.message}
                            </small>
                          )}
                        </label>
                      )}
                      <p className="muted-text" style={{ marginTop: 20 }}>
                        Cancelamentos e reagendamentos até {b.cancelNoticeHours}{" "}
                        horas antes do atendimento.
                      </p>
                      <div className="notice" style={{ marginTop: 20 }}>
                        O Flow gerencia apenas o agendamento e não recebe
                        pagamentos pelos serviços. Não recomendamos pagamentos
                        antecipados solicitados fora da plataforma.
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
              <div
                className={`form-actions mt-4! grid! shrink-0 items-start! gap-3! border-t border-zinc-100 pt-4 [&_.button]:h-14 [&_.button]:min-h-14 [&_.button]:px-3 [&_.button]:py-2 [&_.button]:text-xs sm:[&_.button]:text-sm [&>.button]:w-full [&>.button]:justify-center ${step > 0 ? "grid-cols-2" : "grid-cols-1"}`}
              >
                {step > 0 && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={back}
                    disabled={saving}
                  >
                    <ArrowLeft size={15} />
                    Voltar
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    className="button"
                    disabled={
                      step === 0 ? !service : step === 1 ? !professional : !slot
                    }
                    onClick={() => setStep(step + 1)}
                  >
                    Continuar
                    <AnimatedArrow direction="right" size={16} />
                  </button>
                ) : (
                  <FormSubmitGuard
                    compact
                    schema={bookingSchema(service?.modality === "online")}
                    values={bookingForm.watch()}
                    className="w-full [&>button:first-child]:w-full"
                  >
                    <button className="button" type="submit" disabled={saving}>
                      {saving
                        ? "Reservando…"
                        : !isSignedIn
                          ? "Entrar com Google"
                          : b.approvalMode === "manual"
                            ? "Solicitar agendamento"
                            : "Confirmar agendamento"}
                      <AnimatedArrow direction="right" size={16} />
                    </button>
                  </FormSubmitGuard>
                )}
              </div>
            </form>
            <aside className="self-stretch">
              <div className="panel flex h-full flex-col p-5 sm:p-6">
                <h2 className="mb-4 text-2xl tracking-tight">
                  Seu agendamento
                </h2>
                <div className="grid flex-1 auto-rows-fr">
                  {[
                    { label: "Espaço", value: b.name },
                    { label: "Serviço", value: service?.name },
                    {
                      label: "Duração",
                      value: service
                        ? `${service.durationMinutes} min`
                        : undefined,
                    },
                    {
                      label: "Profissional",
                      value:
                        professional && step >= 1
                          ? professional.name
                          : undefined,
                    },
                    {
                      label: "Data",
                      value:
                        date && step >= 2
                          ? date.split("-").reverse().join("/")
                          : undefined,
                    },
                    {
                      label: "Horário",
                      value:
                        slot && step >= 2
                          ? hourLabel(slot.startsAt, b.timezone)
                          : undefined,
                    },
                    {
                      label: "Valor do serviço",
                      value: service ? money(service.priceCents) : undefined,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="summary-row items-center gap-4 py-3.5"
                    >
                      <span className="shrink-0">{label}</span>
                      <strong
                        className={`min-w-0 break-words text-right ${value ? "text-zinc-800" : "font-normal text-zinc-300"}`}
                        aria-label={value ? undefined : "Ainda não selecionado"}
                      >
                        {value ?? "—"}
                      </strong>
                    </div>
                  ))}
                </div>
                <p className="mt-5 border-t border-zinc-100 pt-4 text-[11px] leading-6 text-zinc-500">
                  O pagamento, quando houver, é combinado diretamente com o
                  estabelecimento.
                </p>
              </div>
            </aside>
          </div>
        )}
        {b.location && (
          <section
            aria-label="Localização do estabelecimento"
            className="mt-6 mb-6 w-full"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Onde nos encontrar
              </h2>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.location.latitude},${b.location.longitude}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF]"
                >
                  Abrir no Google Maps
                  <ArrowSquareOutIcon size={17} aria-hidden="true" />
                </a>
                <a
                  href={`https://www.waze.com/ul?ll=${encodeURIComponent(`${b.location.latitude},${b.location.longitude}`)}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF]"
                >
                  Ir com Waze
                  <NavigationArrowIcon size={17} aria-hidden="true" />
                </a>
              </div>
            </div>
            <LocationMap
              point={b.location}
              unframed
              heightClassName="h-72 sm:h-96"
            />
            {b.address && (
              <p className="mt-3 text-xs leading-6 text-zinc-500">
                {b.address} · {b.city}
              </p>
            )}
          </section>
        )}
      </Container>
    </>
  );
}
