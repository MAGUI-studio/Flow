"use client";
import { Container } from "@/components/container";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema } from "@/lib/form-schemas";
import { phoneMask } from "@/lib/masks";
import { useQueryState, parseAsString } from "nuqs";
import Link from "next/link";
import { BusinessProfileHero } from "./business-profile-hero";
import { DateRail } from "@/components/ui/date-rail";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CalendarDays,
  LoaderCircle,
} from "lucide-react";
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
}: {
  business: BusinessProfile;
  myBookings?: UpcomingBooking[];
  bookingsUserId?: string | null;
}) {
  const { isSignedIn, user } = useUser(),
    clerk = useClerk();
  const [step, setStep] = useState(0),
    [serviceId, setServiceId] = useState(""),
    [professionalId, setProfessionalId] = useState(""),
    [date, setDate] = useState(""),
    [slot, setSlot] = useState<Slot | null>(null),
    [dates, setDates] = useState<string[]>([]),
    [slots, setSlots] = useState<Slot[]>([]),
    [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState<{ id: string; status: string } | null>(
      null,
    ),
    [key, setKey] = useState("");
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
  const bookingForm = useForm({
    resolver: zodResolver(bookingSchema(service?.modality === "online")),
    mode: "onTouched",
    defaultValues: {
      serviceId: "",
      professionalId: "",
      date: "",
      startsAt: "",
      phone: "",
    },
  });
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
  }, [b.id, resume]);
  useEffect(() => {
    if (!serviceId || !professionalId) return;
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
      { signal: abort.signal },
    )
      .then(async (r) => {
        const data = await r.json();
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
  }, [serviceId, professionalId, date]);
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
    bookingForm.setValue("serviceId", serviceId);
    bookingForm.setValue("professionalId", professionalId);
    bookingForm.setValue("date", date);
    bookingForm.setValue("startsAt", slot?.startsAt ?? "");
    await bookingForm.handleSubmit(sendReservation)();
  }
  async function sendReservation() {
    if (!service || !professional || !slot) return;
    if (!isSignedIn) {
      sessionStorage.setItem(
        `flow-booking-${b.id}`,
        JSON.stringify({ serviceId, professionalId, date, slot, phone }),
      );
      await clerk.openSignIn({
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
      <Container as="main" className="page-intro">
        <Link className="back-link" href="/#explorar">
          <ArrowLeft size={14} />
          Explorar espaços
        </Link>
        <BusinessProfileHero business={b} />
        {ownBookings.length > 0 && !success && (
          <section
            className="existing-bookings"
            aria-label="Seus agendamentos neste estabelecimento"
          >
            <div className="existing-bookings-heading">
              <CalendarDays size={18} />
              <div>
                <strong>
                  Você já tem{" "}
                  {ownBookings.length === 1 ? "um agendamento" : "agendamentos"}{" "}
                  aqui
                </strong>
                <p>Confira seus próximos horários em {b.name}.</p>
              </div>
              <Link href="/agendamentos">
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            {ownBookings.map((booking) => (
              <div className="existing-booking" key={booking.id}>
                <span className="existing-booking-date">
                  {new Date(booking.startsAt).toLocaleDateString("pt-BR", {
                    timeZone: b.timezone,
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                  <strong>{hourLabel(booking.startsAt, b.timezone)}</strong>
                </span>
                <div>
                  <strong>{booking.serviceName}</strong>
                  <small>Com {booking.professionalName}</small>
                </div>
                <span className="badge">{statusLabel[booking.status]}</span>
              </div>
            ))}
          </section>
        )}
        {success ? (
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
          <div className="booking-grid">
            <form
              className="panel"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void confirm();
              }}
            >
              <div className="progress">
                {[0, 1, 2, 3].map((n) => (
                  <span className={n <= step ? "active" : ""} key={n} />
                ))}
              </div>
              <div className="eyebrow" style={{ justifyContent: "flex-start" }}>
                PASSO {step + 1} DE 4
              </div>
              <h2 style={{ marginTop: 12 }}>
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
                  {!b.services.length && (
                    <p className="muted-text">
                      Nenhum serviço disponível para agendamento.
                    </p>
                  )}
                  {b.services.map((s) => (
                    <button
                      type="button"
                      className={`choice ${s.id === serviceId ? "active" : ""}`}
                      key={s.id}
                      onClick={() => selectService(s.id)}
                    >
                      <div>
                        <strong>{s.name}</strong>
                        <small>
                          {s.durationMinutes} minutos ·{" "}
                          {s.kind === "collective" ? "Em grupo" : "Individual"}{" "}
                          · {s.modality === "online" ? "Online" : "Presencial"}
                        </small>
                      </div>
                      <strong>{money(s.priceCents)}</strong>
                    </button>
                  ))}
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
                    <strong>{p.name}</strong>
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
                  {!dates.length && !bookedDates.length && !loading ? (
                    <p className="muted-text">
                      Este profissional ainda não abriu novas datas.
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
                                <LoaderCircle size={13} /> Atualizando horários
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
                              {hourLabel(booking.startsAt, b.timezone)} ·{" "}
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
                                  slot?.startsAt === s.startsAt ? "active" : ""
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
                              Não há horários livres nesta data. Escolha outro
                              dia.
                            </p>
                          )}
                          {!slots.length && !timesReady && (
                            <div className="slot-grid" aria-hidden="true">
                              {Array.from({ length: 9 }, (_, index) => (
                                <div className="slot-placeholder" key={index} />
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
                        Compartilhado com o estabelecimento para organizar seu
                        atendimento online.
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
                    O Flow gerencia apenas o agendamento e não recebe pagamentos
                    pelos serviços. Não recomendamos pagamentos antecipados
                    solicitados fora da plataforma.
                  </div>
                </>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                {step > 0 ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={back}
                    disabled={saving}
                  >
                    <ArrowLeft size={15} />
                    Voltar
                  </button>
                ) : (
                  <span />
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
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button className="button" type="submit" disabled={saving}>
                    {saving
                      ? "Reservando…"
                      : !isSignedIn
                        ? "Entrar com Google"
                        : b.approvalMode === "manual"
                          ? "Solicitar agendamento"
                          : "Confirmar agendamento"}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </form>
            <aside>
              <div className="panel">
                <h2>Seu agendamento</h2>
                <div className="summary-row">
                  <span>Espaço</span>
                  <strong>{b.name}</strong>
                </div>
                {service && (
                  <>
                    <div className="summary-row">
                      <span>Serviço</span>
                      <strong>{service.name}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Duração</span>
                      <strong>{service.durationMinutes} min</strong>
                    </div>
                    <div className="summary-row">
                      <span>Valor do serviço</span>
                      <strong>{money(service.priceCents)}</strong>
                    </div>
                  </>
                )}
                {professional && step >= 1 && (
                  <div className="summary-row">
                    <span>Profissional</span>
                    <strong>{professional.name}</strong>
                  </div>
                )}
                {date && step >= 2 && (
                  <div className="summary-row">
                    <span>Data</span>
                    <strong>{date.split("-").reverse().join("/")}</strong>
                  </div>
                )}
                {slot && step >= 2 && (
                  <div className="summary-row">
                    <span>Horário</span>
                    <strong>{hourLabel(slot.startsAt, b.timezone)}</strong>
                  </div>
                )}
                {!service && (
                  <p className="muted-text" style={{ marginTop: 20 }}>
                    Escolha um serviço para começar.
                  </p>
                )}
                <p
                  className="muted-text"
                  style={{ marginTop: 18, fontSize: 11 }}
                >
                  O pagamento, quando houver, é combinado diretamente com o
                  estabelecimento.
                </p>
              </div>
            </aside>
          </div>
        )}
      </Container>
    </>
  );
}
