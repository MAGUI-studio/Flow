"use client";
import {
  FormSubmitGuard,
  FormEditState,
  FieldChanged,
} from "@/components/ui/form-feedback";
import { useRouter } from "next/navigation";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  weeklyScheduleSchema,
  emptyWeeklySchedule,
  type WeeklySchedule,
  weekdays,
} from "@/lib/weekly-schedule";
import { formValidation } from "@/lib/form-validation";
import { FieldError, FormTime } from "@/components/ui/form-controls";
import { notify, useToastError } from "@/components/ui/flow-toaster";
import { Plus, Trash2, Check, CalendarDays, Repeat2 } from "lucide-react";
export function Weekday({ index }: { index: number }) {
  const { register, control, watch, formState } =
    useFormContext<WeeklySchedule>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `days.${index}.intervals`,
  });
  const enabled = watch(`days.${index}.enabled`);
  const busy = formState.isSubmitting;
  return (
    <div
      className={`grid gap-4 rounded-2xl border p-4 transition-colors sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-5 ${enabled ? "border-[#dedaf9] bg-white" : "border-[#eeecf3] bg-[#faf9fc]"}`}
    >
      <label className="group flex min-h-11 cursor-pointer items-center gap-3 self-start rounded-lg text-sm font-semibold text-zinc-700 has-[:disabled]:cursor-wait">
        <input
          type="checkbox"
          {...register(`days.${index}.enabled`)}
          disabled={busy}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="grid size-6 shrink-0 place-items-center rounded-lg border border-[#dcd8e9] bg-white text-transparent shadow-xs transition-colors group-hover:border-[#635BFF]/50 peer-checked:border-[#635BFF] peer-checked:bg-[#635BFF] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[#635BFF] peer-disabled:opacity-50"
        >
          <Check size={14} strokeWidth={3} />
        </span>
        <span className="flex flex-col gap-1">
          <span>
            {weekdays[index]} <FieldChanged name={`days.${index}`} />
          </span>
          <span
            className={`text-[11px] font-normal ${enabled ? "text-[#635BFF]" : "text-zinc-400"}`}
          >
            {enabled ? "Atendimento ativo" : "Dia de folga"}
          </span>
        </span>
      </label>
      <div className="min-w-0">
        {!enabled ? (
          <div className="flex min-h-11 items-center gap-2 text-xs text-zinc-400">
            <span aria-hidden="true" className="h-px w-5 bg-zinc-200" />
            Sem atendimento neste dia
          </div>
        ) : (
          <>
            <div className="w-full space-y-3">
              {fields.map((field, j) => (
                <div
                  key={field.id}
                  className="flex items-start gap-2 border-b border-[#efedf5] pb-3 last:border-0 last:pb-0"
                >
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 min-[480px]:grid-cols-2 [&_.flow-time-field]:mt-1.5! [&_.flow-time-field]:gap-1.5 [&_.flow-select-trigger]:h-10! [&_.flow-select-trigger]:min-h-10! [&_.flow-select-trigger]:rounded-lg! [&_.flow-select-trigger]:px-2! [&_.flow-select-trigger]:text-xs!">
                    <div className="min-w-0">
                      <span className="text-[11px] font-medium text-zinc-500">
                        Das{" "}
                        <FieldChanged
                          name={`days.${index}.intervals.${j}.start`}
                        />
                      </span>
                      <FormTime name={`days.${index}.intervals.${j}.start`} />
                      <FieldError name={`days.${index}.intervals.${j}.start`} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-medium text-zinc-500">
                        Até{" "}
                        <FieldChanged
                          name={`days.${index}.intervals.${j}.end`}
                        />
                      </span>
                      <FormTime name={`days.${index}.intervals.${j}.end`} />
                      <FieldError name={`days.${index}.intervals.${j}.end`} />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Remover horário ${j + 1} de ${weekdays[index]}`}
                    onClick={() => remove(j)}
                    className="mt-6 grid size-10 shrink-0 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF] disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <FieldError name={`days.${index}.intervals`} />
            <button
              type="button"
              disabled={busy || fields.length >= 6}
              onClick={() => append({ start: "13:00", end: "18:00" })}
              className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#635BFF] transition-colors hover:bg-[#F5F4FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF] disabled:opacity-50"
            >
              <Plus size={14} />
              Adicionar horário
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export function ProfessionalSchedule({
  professionalId,
  establishmentId,
  timezone,
  schedule,
}: {
  professionalId: string;
  establishmentId: string;
  timezone: string;
  schedule: WeeklySchedule | null;
}) {
  const router = useRouter();
  const setError = useToastError();
  const form = useForm({
    ...formValidation,
    resolver: zodResolver(weeklyScheduleSchema),
    defaultValues: schedule ?? emptyWeeklySchedule(),
  });
  async function save(values: WeeklySchedule) {
    try {
      const response = await fetch(
        `/api/professionals/${professionalId}/schedule`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ establishmentId, ...values }),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      form.reset(values);
      router.refresh();
      notify.success(
        "Horários salvos",
        "A rotina se repete automaticamente todas as semanas.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar os horários.",
      );
    }
  }
  return (
    <section
      aria-label="Horários de atendimento"
      className="mt-5 overflow-hidden rounded-2xl border border-[#e8e5f0] bg-white"
    >
      <div className="relative isolate overflow-hidden border-b border-[#efedf5] px-5 py-5 sm:px-6">
        <CalendarDays
          aria-hidden="true"
          className="pointer-events-none absolute -right-5 -bottom-8 -z-10 size-44 -rotate-12 text-[#635BFF] opacity-[0.05]"
        />
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#635BFF]">
          Uma rotina com Flow
        </p>
        <h2 className="text-lg font-semibold text-zinc-900">
          Horários de atendimento
        </h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-500">
          Selecione os dias em que o profissional atende e defina os horários de
          cada dia. Essa rotina se repete toda semana, até você alterar.
        </p>
        <p className="mt-3 max-w-xl text-xs leading-relaxed text-zinc-400">
          Para uma pausa no almoço, adicione dois horários: 09:00–12:00 e
          13:00–18:00. Fuso: {timezone}.
        </p>
      </div>
      <FormProvider {...form}>
        <FormEditState editing={true}>
          <form
            noValidate
            aria-busy={form.formState.isSubmitting}
            onSubmit={form.handleSubmit(save)}
          >
            <div className="space-y-3 px-5 py-5 sm:px-6">
              {weekdays.map((day, index) => (
                <Weekday key={day} index={index} />
              ))}
              <FieldError name="days" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#efedf5] bg-[#faf9fd] px-5 py-4 sm:px-6">
              <p className="inline-flex items-center gap-2 text-xs text-zinc-500">
                <Repeat2
                  size={15}
                  aria-hidden="true"
                  className="shrink-0 text-[#635BFF]"
                />
                Repete toda semana após salvar.
              </p>
              <FormSubmitGuard
                schema={weeklyScheduleSchema}
                values={form.watch()}
              >
                <button
                  type="submit"
                  className="button"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Salvando…"
                    : "Salvar horários"}
                </button>
              </FormSubmitGuard>
            </div>
          </form>
        </FormEditState>
      </FormProvider>
    </section>
  );
}
