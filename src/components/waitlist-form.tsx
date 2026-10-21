"use client";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { waitlistSchema } from "@/lib/scheduling-schemas";
import { FormEditState, FormSubmitGuard } from "./ui/form-feedback";
import { SchedulingField } from "./internal/scheduling-forms";
import { phoneMask } from "@/lib/masks";
import { notify, useToastError } from "./ui/flow-toaster";
import { useRouter } from "next/navigation";
import { useState } from "react";
const style =
  "min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm";
export function WaitlistForm({
  serviceId,
  professionalId = "",
  professionals,
  today,
  horizon,
}: {
  serviceId: string;
  professionalId?: string;
  professionals: { id: string; name: string }[];
  today: string;
  horizon: string;
}) {
  const form = useForm({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      serviceId,
      professionalId,
      fromDate: today,
      toDate: horizon,
      fromTime: "09:00",
      toTime: "18:00",
      weekdays: [1, 2, 3, 4, 5],
      phone: "",
    },
  });
  const error = useToastError();
  const router = useRouter();
  const values = form.watch();
  return (
    <FormProvider {...form}>
      <FormEditState editing={false}>
        <form
          noValidate
          className="space-y-5"
          onSubmit={form.handleSubmit(async (data) => {
            try {
              const r = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
              const result = await r.json();
              if (!r.ok) throw Error(result.error);
              notify.success("Você entrou na lista de espera");
              form.reset(data);
              router.push("/lista-de-espera");
              router.refresh();
            } catch (e) {
              error((e as Error).message);
            }
          })}
        >
          <p className="text-sm leading-6 text-zinc-500">
            Avise quando você pode vir. Se surgir uma vaga, você receberá uma
            notificação no Flow e terá 30 minutos para aceitar. A inscrição não
            confirma um agendamento.
          </p>
          <SchedulingField
            name="professionalId"
            label="Preferência de profissional"
            required={false}
          >
            <select className={style} {...form.register("professionalId")}>
              <option value="">Qualquer profissional habilitado</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </SchedulingField>
          <div className="grid gap-4 sm:grid-cols-2">
            <SchedulingField name="fromDate" label="A partir de">
              <input
                type="date"
                min={today}
                max={horizon}
                className={style}
                {...form.register("fromDate")}
              />
            </SchedulingField>
            <SchedulingField name="toDate" label="Até">
              <input
                type="date"
                min={today}
                max={horizon}
                className={style}
                {...form.register("toDate")}
              />
            </SchedulingField>
            <SchedulingField name="fromTime" label="Horário inicial">
              <input
                type="time"
                className={style}
                {...form.register("fromTime")}
              />
            </SchedulingField>
            <SchedulingField name="toTime" label="Horário final">
              <input
                type="time"
                className={style}
                {...form.register("toTime")}
              />
            </SchedulingField>
          </div>
          <fieldset>
            <legend className="mb-3 text-xs font-medium text-zinc-600">
              Dias da semana <span className="text-[#635BFF]">*</span>
            </legend>
            <div className="flex flex-wrap gap-3">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => (
                <label key={d} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={values.weekdays.includes(i)}
                    onChange={(e) =>
                      form.setValue(
                        "weekdays",
                        e.target.checked
                          ? [...values.weekdays, i]
                          : values.weekdays.filter((v) => v !== i),
                        { shouldDirty: true, shouldValidate: true },
                      )
                    }
                  />
                  {d}
                </label>
              ))}
            </div>
            {form.formState.errors.weekdays && (
              <p className="mt-2 text-xs text-rose-600">
                {form.formState.errors.weekdays.message}
              </p>
            )}
          </fieldset>
          <SchedulingField name="phone" label="WhatsApp">
            <input
              type="tel"
              className={style}
              {...form.register("phone")}
              onChange={(e) =>
                form.setValue("phone", phoneMask(e.target.value), {
                  shouldDirty: true,
                })
              }
              placeholder="(12) 98184-7553"
            />
          </SchedulingField>
          <FormSubmitGuard schema={waitlistSchema} values={values}>
            <button className="button" disabled={form.formState.isSubmitting}>
              Entrar na lista de espera
            </button>
          </FormSubmitGuard>
        </form>
      </FormEditState>
    </FormProvider>
  );
}
export function WaitlistAction({
  id,
  accept,
}: {
  id: string;
  accept: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const error = useToastError();
  const router = useRouter();
  return (
    <button
      type="button"
      className={accept ? "button" : "button secondary"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await fetch("/api/waitlist", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, accept }),
          });
          const data = await r.json();
          if (!r.ok) throw Error(data.error);
          notify.success(
            accept
              ? "Vaga aceita. Confira seu agendamento."
              : "Inscrição cancelada",
          );
          router.refresh();
        } catch (e) {
          error((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy
        ? "Salvando…"
        : accept
          ? "Aceitar esta vaga"
          : "Sair da lista de espera"}
    </button>
  );
}
