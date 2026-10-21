"use client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rescheduleSchema } from "@/lib/scheduling-schemas";
import { hourLabel, money } from "@/lib/format";
import { FormEditState, FormSubmitGuard } from "./ui/form-feedback";
import { notify, useToastError } from "./ui/flow-toaster";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DateRail } from "./ui/date-rail";
import { ScrollArea } from "./ui/scrollArea";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CalendarDotsIcon,
  UserIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
export function RescheduleForm({
  bookingId,
  professionalId,
  timezone,
  original,
  returnTo = "/agendamentos",
  details,
}: {
  bookingId: string;
  professionalId: string;
  timezone: string;
  original: string;
  returnTo?: string;
  details?: {
    businessName: string;
    serviceName: string;
    durationMinutes: number;
    priceCents: number;
  };
}) {
  const form = useForm({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: { professionalId, date: "", startsAt: "" },
  });
  const values = form.watch();
  const [step, setStep] = useState(0);
  const [availability, setAvailability] = useState<{
    professionals: { id: string; name: string }[];
    dates: string[];
    slots: { startsAt: string }[];
  }>({ professionals: [], dates: [], slots: [] });
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState("");
  const error = useToastError();
  const router = useRouter();
  const requestKey = `${values.professionalId}:${values.date}`;
  const timesReady = !loading && resolved === requestKey;
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    fetch(
      `/api/bookings/${bookingId}/reschedule?${new URLSearchParams({ professionalId: values.professionalId, ...(values.date ? { date: values.date } : {}) })}`,
      { signal: abort.signal, cache: "no-store" },
    )
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        if (!abort.signal.aborted) {
          setAvailability(data);
          setResolved(requestKey);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") error(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [bookingId, values.professionalId, values.date]);
  const professional = availability.professionals.find(
    (p) => p.id === values.professionalId,
  );
  async function submit(data: typeof values) {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      notify.success(
        result.pending ? "Reagendamento solicitado" : "Agendamento reagendado",
      );
      form.reset(data);
      router.push(returnTo);
      router.refresh();
    } catch (e) {
      error((e as Error).message);
    }
  }
  return (
    <FormProvider {...form}>
      <FormEditState editing={false}>
        <div className="booking-grid mb-0 w-full">
          <form
            noValidate
            className="panel flex h-[660px] min-w-0 flex-col p-5 sm:p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 2) void form.handleSubmit(submit)();
            }}
          >
            <div className="progress shrink-0">
              {[0, 1, 2].map((n) => (
                <span key={n} className={n <= step ? "active" : ""} />
              ))}
            </div>
            <div className="eyebrow justify-start">PASSO {step + 1} DE 3</div>
            <h2 className="mt-3 min-h-16 shrink-0 tracking-tight">
              {
                [
                  "Com quem você quer agendar?",
                  "Qual é o seu melhor momento?",
                  "Confira a mudança de horário",
                ][step]
              }
            </h2>
            <ScrollArea
              key={step}
              role="region"
              aria-label={
                [
                  "Selecionar profissional",
                  "Selecionar data e horário",
                  "Confirmar reagendamento",
                ][step]
              }
              className="min-h-0 flex-1"
              viewportClassName="overscroll-auto"
            >
              <div className="pr-3 pb-2">
                {step === 0 && (
                  <>
                    <p className="mb-4 text-xs leading-6 text-zinc-500">
                      Mantenha seu profissional ou escolha outra pessoa para
                      realizar o mesmo serviço.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availability.professionals.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={p.id === values.professionalId}
                          className={`choice m-0! min-w-0 ${p.id === values.professionalId ? "active" : ""}`}
                          onClick={() => {
                            if (p.id === values.professionalId) return;
                            form.setValue("professionalId", p.id, {
                              shouldDirty: true,
                            });
                            form.setValue("date", "");
                            form.setValue("startsAt", "");
                            setAvailability((v) => ({
                              ...v,
                              dates: [],
                              slots: [],
                            }));
                          }}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F4FF] text-[#635BFF]">
                              <UserIcon aria-hidden="true" size={20} />
                            </span>
                            <strong className="truncate">{p.name}</strong>
                          </span>
                          {p.id === values.professionalId ? (
                            <CheckIcon
                              aria-hidden="true"
                              size={18}
                              className="shrink-0 text-[#635BFF]"
                            />
                          ) : (
                            <ArrowRightIcon
                              aria-hidden="true"
                              size={18}
                              className="shrink-0"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                    {loading && !availability.professionals.length && (
                      <p role="status" className="py-6 text-sm text-zinc-500">
                        Buscando profissionais…
                      </p>
                    )}
                  </>
                )}
                {step === 1 && (
                  <>
                    <DateRail
                      dates={availability.dates}
                      value={values.date}
                      loading={loading}
                      onChange={(date) => {
                        form.setValue("date", date, { shouldDirty: true });
                        form.setValue("startsAt", "");
                      }}
                    />
                    {!availability.dates.length && !loading && (
                      <p className="py-6 text-sm text-zinc-500">
                        Não há datas disponíveis para este profissional. Volte
                        para escolher outra pessoa.
                      </p>
                    )}
                    {values.date && (
                      <>
                        <div className="slots-heading">
                          <h3>Horários disponíveis</h3>
                          <span role="status" className="slots-status">
                            {!timesReady ? (
                              <span className="inline-flex items-center gap-2">
                                <SpinnerGapIcon
                                  aria-hidden="true"
                                  size={14}
                                  className="animate-spin"
                                />
                                Atualizando horários
                              </span>
                            ) : (
                              `${availability.slots.length} horários disponíveis`
                            )}
                          </span>
                        </div>
                        <div className="slot-grid">
                          {availability.slots.map((s) => (
                            <button
                              key={s.startsAt}
                              type="button"
                              disabled={!timesReady}
                              aria-pressed={s.startsAt === values.startsAt}
                              className={
                                s.startsAt === values.startsAt ? "active" : ""
                              }
                              onClick={() =>
                                form.setValue("startsAt", s.startsAt, {
                                  shouldDirty: true,
                                })
                              }
                            >
                              {hourLabel(s.startsAt, timezone)}
                            </button>
                          ))}
                        </div>
                        {timesReady && !availability.slots.length && (
                          <p className="py-6 text-sm text-zinc-500">
                            Não há horários livres nesta data. Escolha outro
                            dia.
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="relative isolate overflow-hidden rounded-xl border border-[#635BFF]/15 bg-[#F5F4FF] p-5">
                      <CalendarDotsIcon
                        aria-hidden="true"
                        weight="light"
                        className="pointer-events-none absolute -right-3 -bottom-5 -z-10 size-32 -rotate-12 text-[#635BFF]/10"
                      />
                      <p className="text-xs font-medium text-zinc-500">
                        Agendamento atual
                      </p>
                      <p className="mt-2 text-sm font-semibold text-zinc-700">
                        {original}
                      </p>
                    </div>
                    <p className="text-sm leading-7 text-zinc-500">
                      Seu horário original fica reservado até a confirmação da
                      mudança. Se houver aprovação manual, ele será mantido até
                      o estabelecimento aceitar.
                    </p>
                    <div className="rounded-xl border border-zinc-200 p-5">
                      <p className="text-xs font-medium text-[#635BFF]">
                        Novo atendimento
                      </p>
                      <p className="mt-3 text-base font-semibold">
                        {values.date.split("-").reverse().join("/")} às{" "}
                        {values.startsAt &&
                          hourLabel(values.startsAt, timezone)}
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        Com {professional?.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="form-actions mt-4! grid! shrink-0 grid-cols-2 items-start! gap-3! border-t border-zinc-100 pt-4 [&_.button]:h-14 [&_.button]:min-h-14 [&_.button]:justify-center [&_.button]:px-3 [&_.button]:py-2 [&_.button]:text-xs sm:[&_.button]:text-sm">
              {step === 0 ? (
                <Link href={returnTo} className="button secondary">
                  <ArrowLeftIcon aria-hidden="true" size={16} />
                  Cancelar
                </Link>
              ) : (
                <button
                  type="button"
                  className="button secondary"
                  disabled={form.formState.isSubmitting}
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeftIcon aria-hidden="true" size={16} />
                  Voltar
                </button>
              )}
              {step < 2 ? (
                <button
                  type="button"
                  className="button"
                  disabled={
                    step === 0
                      ? !professional || loading
                      : !values.startsAt || !timesReady
                  }
                  onClick={() => setStep(step + 1)}
                >
                  Continuar
                  <ArrowRightIcon aria-hidden="true" size={16} />
                </button>
              ) : (
                <FormSubmitGuard
                  compact
                  schema={rescheduleSchema}
                  values={values}
                  className="w-full [&>button:first-child]:w-full"
                >
                  <button
                    className="button"
                    type="submit"
                    disabled={form.formState.isSubmitting || !timesReady}
                  >
                    {form.formState.isSubmitting
                      ? "Salvando…"
                      : "Confirmar reagendamento"}
                    <ArrowRightIcon aria-hidden="true" size={16} />
                  </button>
                </FormSubmitGuard>
              )}
            </div>
          </form>
          <aside className="self-stretch">
            <div className="panel flex h-full flex-col p-5 sm:p-6">
              <h2 className="mb-4 text-2xl tracking-tight">Seu agendamento</h2>
              <div className="grid flex-1 auto-rows-fr">
                {[
                  { label: "Espaço", value: details?.businessName },
                  { label: "Serviço", value: details?.serviceName },
                  {
                    label: "Duração",
                    value: details
                      ? `${details.durationMinutes} min`
                      : undefined,
                  },
                  { label: "Profissional", value: professional?.name },
                  {
                    label: "Nova data",
                    value: values.date
                      ? values.date.split("-").reverse().join("/")
                      : undefined,
                  },
                  {
                    label: "Novo horário",
                    value: values.startsAt
                      ? hourLabel(values.startsAt, timezone)
                      : undefined,
                  },
                  {
                    label: "Valor do serviço",
                    value: details ? money(details.priceCents) : undefined,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 border-b border-zinc-100 py-4 text-xs"
                  >
                    <span className="text-zinc-400">{item.label}</span>
                    <strong className="text-right font-semibold text-zinc-800">
                      {item.value || "—"}
                    </strong>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-6 text-zinc-500">
                O serviço permanece o mesmo. Confira a nova data e o
                profissional antes de confirmar.
              </p>
            </div>
          </aside>
        </div>
      </FormEditState>
    </FormProvider>
  );
}
