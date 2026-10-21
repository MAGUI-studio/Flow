"use client";
import {
  useState,
  useId,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import {
  blockSchema,
  noteSchema,
  seriesSchema,
} from "@/lib/scheduling-schemas";
import {
  FieldChanged,
  FormEditState,
  FormSubmitGuard,
} from "../ui/form-feedback";
import { notify, useToastError } from "../ui/flow-toaster";
import { phoneMask } from "@/lib/masks";
type Option = { id: string; name: string };
const inputStyle =
  "min-h-11 w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/10";
export function SchedulingField({
  name,
  label,
  children,
  required = true,
}: {
  name: string;
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  const {
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message;
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-2 text-xs font-medium text-zinc-600">
      <label htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-[#635BFF]">*</span>}
        <FieldChanged name={name} />
      </label>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
            id,
            "aria-invalid": !!error,
            "aria-describedby": error ? `${id}-error` : undefined,
          })
        : children}
      {typeof error === "string" && (
        <span id={`${id}-error`} role="alert" className="text-xs text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}
export async function schedulingCommand(
  action: string,
  data: Record<string, unknown>,
) {
  const response = await fetch("/api/scheduling", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error);
  return result;
}
export function WorkflowButton({
  action,
  payload,
  children,
  confirm,
}: {
  action: string;
  payload: Record<string, unknown>;
  children: ReactNode;
  confirm?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const error = useToastError();
  const router = useRouter();
  async function run() {
    setBusy(true);
    try {
      await schedulingCommand(action, payload);
      notify.success("Alteração salva");
      setConfirming(false);
      router.refresh();
    } catch (e) {
      error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="button secondary"
        disabled={busy}
        type="button"
        onClick={() => (confirm ? setConfirming(true) : void run())}
      >
        {busy ? "Salvando…" : children}
      </button>
      {confirming && (
        <div className="w-full rounded-xl border border-[#e8e5f6] bg-[#F5F4FF] p-3 text-xs">
          <p>{confirm}</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              disabled={busy}
              className="font-semibold text-[#635BFF]"
              onClick={() => void run()}
            >
              Confirmar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Manter como está
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export function BlockForm({
  establishmentId,
  professionals,
  timezone,
}: {
  establishmentId: string;
  professionals: Option[];
  timezone: string;
}) {
  const form = useForm<
    z.input<typeof blockSchema>,
    unknown,
    z.output<typeof blockSchema>
  >({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      establishmentId,
      professionalIds: [],
      fromDate: "",
      toDate: "",
      allDay: false,
      fromTime: "09:00",
      toTime: "18:00",
      reason: "",
      cancelConflicts: false,
      conflictIds: [],
    },
  });
  const [conflicts, setConflicts] = useState<
    { id: string; startsAt: string; service: string; professional: string }[]
  >([]);
  const error = useToastError();
  const router = useRouter();
  const values = form.watch();
  async function save(data: z.output<typeof blockSchema>) {
    try {
      const result = await schedulingCommand("block", { values: data });
      if (result.conflicts?.length) {
        setConflicts(result.conflicts);
        form.setValue(
          "conflictIds",
          result.conflicts.map((b: { id: string }) => b.id),
        );
        return;
      }
      notify.success("Período bloqueado");
      setConflicts([]);
      form.reset();
      router.refresh();
    } catch (e) {
      error((e as Error).message);
    }
  }
  return (
    <FormProvider {...form}>
      <FormEditState editing={false}>
        <form
          onSubmit={form.handleSubmit(save)}
          className="space-y-5"
          noValidate
        >
          <p className="text-xs text-zinc-500">
            Horários no fuso {timezone}. Sem profissionais selecionados, o
            bloqueio vale para toda a equipe, inclusive novos profissionais.
          </p>
          <SchedulingField name="reason" label="Motivo">
            <input
              className={inputStyle}
              {...form.register("reason")}
              placeholder="Feriado, férias, compromisso…"
            />
          </SchedulingField>
          <div className="grid gap-4 sm:grid-cols-2">
            <SchedulingField name="fromDate" label="Data inicial">
              <input
                type="date"
                className={inputStyle}
                {...form.register("fromDate")}
              />
            </SchedulingField>
            <SchedulingField name="toDate" label="Data final">
              <input
                type="date"
                className={inputStyle}
                {...form.register("toDate")}
              />
            </SchedulingField>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("allDay")} />
            Dia inteiro
          </label>
          {!values.allDay && (
            <div className="grid gap-4 sm:grid-cols-2">
              <SchedulingField name="fromTime" label="Início">
                <input
                  type="time"
                  className={inputStyle}
                  {...form.register("fromTime")}
                />
              </SchedulingField>
              <SchedulingField name="toTime" label="Término">
                <input
                  type="time"
                  className={inputStyle}
                  {...form.register("toTime")}
                />
              </SchedulingField>
            </div>
          )}
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-medium text-zinc-600">
              Profissionais · deixe vazio para toda a equipe
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {professionals.map((p) => (
                <label className="flex items-center gap-2 text-sm" key={p.id}>
                  <input
                    type="checkbox"
                    value={p.id}
                    {...form.register("professionalIds")}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </fieldset>
          {!!conflicts.length && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-semibold">Revise os atendimentos afetados</p>
              <ul className="mt-3 space-y-2">
                {conflicts.map((b) => (
                  <li key={b.id}>
                    {b.service} · {b.professional} ·{" "}
                    {new Date(b.startsAt).toLocaleString("pt-BR", {
                      timeZone: timezone,
                    })}
                  </li>
                ))}
              </ul>
              <label className="mt-4 flex items-start gap-2">
                <input type="checkbox" {...form.register("cancelConflicts")} />
                Confirmo o cancelamento desses atendimentos para bloquear o
                período. Os clientes serão notificados.
              </label>
            </div>
          )}
          <FormSubmitGuard
            schema={blockSchema}
            values={values}
            issues={
              conflicts.length && !values.cancelConflicts
                ? [
                    "Confirme o cancelamento dos atendimentos afetados ou ajuste o período.",
                  ]
                : []
            }
          >
            <button className="button" disabled={form.formState.isSubmitting}>
              {conflicts.length
                ? "Confirmar bloqueio"
                : "Verificar e bloquear período"}
            </button>
          </FormSubmitGuard>
        </form>
      </FormEditState>
    </FormProvider>
  );
}
export function CustomerNoteForm({
  establishmentId,
  consumerId,
  note,
}: {
  establishmentId: string;
  consumerId: string;
  note?: { id: string; content: string };
}) {
  const form = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      establishmentId,
      consumerId,
      content: note?.content ?? "",
    },
  });
  const error = useToastError();
  const router = useRouter();
  return (
    <FormProvider {...form}>
      <FormEditState editing={!!note}>
        <form
          className="space-y-3"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await schedulingCommand("note", { values, id: note?.id });
              notify.success("Observação salva");
              form.reset(values);
              router.refresh();
            } catch (e) {
              error((e as Error).message);
            }
          })}
        >
          <SchedulingField
            name="content"
            label={
              note ? "Editar observação privada" : "Nova observação privada"
            }
          >
            <textarea
              rows={3}
              className={inputStyle}
              maxLength={5000}
              {...form.register("content")}
            />
          </SchedulingField>
          <FormSubmitGuard schema={noteSchema} values={form.watch()}>
            <button
              className="button secondary"
              disabled={form.formState.isSubmitting}
            >
              Salvar observação
            </button>
          </FormSubmitGuard>
        </form>
      </FormEditState>
    </FormProvider>
  );
}
export function SeriesForm({
  establishmentId,
  customers,
  services,
  professionals,
  timezone,
  editing,
}: {
  establishmentId: string;
  customers: Option[];
  services: (Option & { professionalIds: string[] })[];
  professionals: Option[];
  timezone: string;
  editing?: {
    id: string;
    fromBookingId: string;
    initial: Partial<z.input<typeof seriesSchema>>;
  };
}) {
  const form = useForm<
    z.input<typeof seriesSchema>,
    unknown,
    z.output<typeof seriesSchema>
  >({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      establishmentId,
      consumerId: "",
      serviceId: "",
      professionalId: "",
      fromDate: "",
      time: "09:00",
      intervalWeeks: 1,
      count: 4,
      phone: "",
      untilDate: "",
      excludedDates: [],
      ...editing?.initial,
    },
  });
  const [occurrences, setOccurrences] = useState<
    { date: string; available: boolean; excluded: boolean }[]
  >([]);
  const [snapshot, setSnapshot] = useState("");
  const error = useToastError();
  const router = useRouter();
  const values = form.watch();
  const fingerprint = (v: typeof values) =>
    JSON.stringify([
      v.establishmentId,
      v.consumerId,
      v.serviceId,
      v.professionalId,
      v.fromDate,
      v.time,
      v.intervalWeeks,
      v.count,
      v.phone,
      v.untilDate,
    ]);
  const ready = occurrences.length > 0 && snapshot === fingerprint(values);
  async function submit(data: z.infer<typeof seriesSchema>, preview: boolean) {
    try {
      const result = await schedulingCommand(
        editing ? "replaceSeries" : "series",
        {
          values: data,
          preview,
          ...(editing
            ? { id: editing.id, fromBookingId: editing.fromBookingId }
            : {}),
        },
      );
      if (preview) {
        setOccurrences(result.occurrences);
        setSnapshot(fingerprint(data));
      } else {
        notify.success(`${result.count} atendimentos confirmados`);
        form.reset();
        setOccurrences([]);
        router.push(`/painel/recorrencias?estabelecimento=${establishmentId}`);
        router.refresh();
      }
    } catch (e) {
      error((e as Error).message);
    }
  }
  return (
    <FormProvider {...form}>
      <FormEditState editing={!!editing}>
        <form
          noValidate
          onSubmit={form.handleSubmit((v) => submit(v, true))}
          className="space-y-5"
        >
          <p className="text-xs leading-6 text-zinc-500">
            Crie até 12 atendimentos semanais ou quinzenais. A prévia identifica
            conflitos; desmarque as datas que não deseja criar. Horários em{" "}
            {timezone}.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <SchedulingField name="consumerId" label="Cliente">
              <select className={inputStyle} {...form.register("consumerId")}>
                <option value="">Selecione</option>
                {customers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </SchedulingField>
            <SchedulingField name="serviceId" label="Serviço">
              <select
                className={inputStyle}
                {...form.register("serviceId", {
                  onChange: () => form.setValue("professionalId", ""),
                })}
              >
                <option value="">Selecione</option>
                {services.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </SchedulingField>
            <SchedulingField name="professionalId" label="Profissional">
              <select
                className={inputStyle}
                {...form.register("professionalId")}
              >
                <option value="">Selecione</option>
                {professionals
                  .filter((p) =>
                    services
                      .find((s) => s.id === values.serviceId)
                      ?.professionalIds.includes(p.id),
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </SchedulingField>
            <SchedulingField name="phone" label="WhatsApp do cliente">
              <input
                type="tel"
                className={inputStyle}
                {...form.register("phone")}
                onChange={(e) =>
                  form.setValue("phone", phoneMask(e.target.value), {
                    shouldDirty: true,
                  })
                }
              />
            </SchedulingField>
            <SchedulingField name="fromDate" label="Primeiro atendimento">
              <input
                type="date"
                className={inputStyle}
                {...form.register("fromDate")}
              />
            </SchedulingField>
            <SchedulingField name="time" label="Horário">
              <input
                type="time"
                className={inputStyle}
                {...form.register("time")}
              />
            </SchedulingField>
            <SchedulingField name="intervalWeeks" label="Frequência">
              <select
                className={inputStyle}
                {...form.register("intervalWeeks", { valueAsNumber: true })}
              >
                <option value={1}>Semanal</option>
                <option value={2}>Quinzenal</option>
              </select>
            </SchedulingField>
            <SchedulingField name="count" label="Quantidade de atendimentos">
              <input
                type="number"
                min={2}
                max={12}
                className={inputStyle}
                {...form.register("count", { valueAsNumber: true })}
              />
            </SchedulingField>
            <SchedulingField
              name="untilDate"
              label="Encerrar até esta data (opcional)"
              required={false}
            >
              <input
                type="date"
                min={values.fromDate}
                className={inputStyle}
                {...form.register("untilDate")}
              />
            </SchedulingField>
          </div>
          <FormSubmitGuard schema={seriesSchema} values={values}>
            <button
              className="button secondary"
              disabled={form.formState.isSubmitting}
            >
              Verificar datas e conflitos
            </button>
          </FormSubmitGuard>
          {ready && (
            <div className="space-y-3 rounded-xl border border-zinc-200 p-4">
              <p className="text-sm font-semibold">
                Confira a sequência antes de confirmar
              </p>
              {occurrences.map((o) => (
                <label key={o.date} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!values.excludedDates.includes(o.date)}
                    onChange={(e) =>
                      form.setValue(
                        "excludedDates",
                        e.target.checked
                          ? values.excludedDates.filter((d) => d !== o.date)
                          : [...values.excludedDates, o.date],
                        { shouldDirty: true },
                      )
                    }
                  />
                  {o.date.split("-").reverse().join("/")} · {values.time}
                  <span
                    className={
                      o.available ? "text-emerald-700" : "text-amber-700"
                    }
                  >
                    {o.available
                      ? "Disponível"
                      : "Indisponível — desmarque ou ajuste"}
                  </span>
                </label>
              ))}
              <button
                type="button"
                className="button"
                disabled={
                  form.formState.isSubmitting ||
                  occurrences.every((o) =>
                    values.excludedDates.includes(o.date),
                  ) ||
                  occurrences.some(
                    (o) =>
                      !o.available && !values.excludedDates.includes(o.date),
                  )
                }
                onClick={() =>
                  void form.handleSubmit((v) => submit(v, false))()
                }
              >
                Confirmar sequência
              </button>
            </div>
          )}
        </form>
      </FormEditState>
    </FormProvider>
  );
}
