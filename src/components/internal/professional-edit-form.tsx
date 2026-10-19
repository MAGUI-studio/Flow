"use client";
import type { WeeklySchedule } from "@/lib/weekly-schedule";
import { notify, useToastError } from "@/components/ui/flow-toaster";
import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CalendarDays,
  Info,
  LoaderCircle,
  Users,
  ShieldAlert,
} from "lucide-react";
import { professionalSchema } from "@/lib/form-schemas";
import { professionalStatusSchema } from "@/lib/professional-status";
import { formValidation } from "@/lib/form-validation";
import { panelHref } from "@/lib/url-state";
import { FormSection } from "./primitives";
import { ProfessionalPhoto } from "./professional-photo";
import { ProfessionalSchedule } from "./professional-schedule";
import { ProfessionalDelete } from "./professional-delete";
import { FlowSelect } from "@/components/ui/flow-select";
import { FieldError, FormDate } from "@/components/ui/form-controls";
import { AnimatedArrow } from "@/components/ui/animated-arrow";
const tabs = [
  { value: "dados", label: "Dados do profissional", icon: Users },
  { value: "horarios", label: "Horários", icon: CalendarDays },
  { value: "perigo", label: "Zona de perigo", icon: ShieldAlert },
] as const;
const schema = professionalSchema
  .extend({
    status: z.enum(["active", "inactive", "vacation"]),
    start: z.string(),
    end: z.string(),
  })
  .superRefine((v, ctx) => {
    const result = professionalStatusSchema.safeParse(v);
    if (!result.success)
      for (const issue of result.error.issues)
        ctx.addIssue({
          code: "custom",
          path: issue.path,
          message: issue.message,
        });
  });
type Professional = {
  id: string;
  name: string;
  photoUrl?: string;
  status: "active" | "inactive" | "vacation";
  start: string;
  end: string;
};
export function ProfessionalEditForm({
  professional,
  business,
  schedule,
}: {
  professional: Professional;
  schedule: WeeklySchedule | null;
  business: { id: string; name: string; timezone: string };
}) {
  const [tab, setTab] = useQueryState(
    "aba",
    parseAsStringLiteral(["dados", "horarios", "perigo"] as const)
      .withDefault("dados")
      .withOptions({ shallow: true, scroll: false, history: "push" }),
  );
  const tabListRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);
  useLayoutEffect(() => {
    const list = tabListRef.current;
    if (!list) return;
    const update = () => {
      const active = list.querySelector<HTMLElement>('[aria-selected="true"]');
      if (active)
        setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    list
      .querySelectorAll("button")
      .forEach((button) => observer.observe(button));
    return () => observer.disconnect();
  }, [tab]);
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const panel = panelsRef.current?.querySelector<HTMLElement>(
      '[role="tabpanel"]:not([hidden])',
    );
    const animation = panel?.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 200, easing: "ease-out" },
    );
    return () => animation?.cancel();
  }, [tab]);
  const setError = useToastError();
  const router = useRouter();
  const back = panelHref("/painel/profissionais", business.id);
  const [file, setFile] = useState<File>(),
    [photoBusy, setPhotoBusy] = useState(false);
  const form = useForm({
    ...formValidation,
    resolver: zodResolver(schema),
    defaultValues: {
      name: professional.name,
      status: professional.status,
      start: professional.start,
      end: professional.end,
    },
  });
  const name = form.watch("name"),
    status = form.watch("status"),
    busy = form.formState.isSubmitting;
  async function submit(values: z.infer<typeof schema>) {
    if (photoBusy) return;
    setError("");
    try {
      let response: Response;
      if (file) {
        const data = new FormData();
        data.set("file", file);
        data.set("establishmentId", business.id);
        data.set("professionalId", professional.id);
        for (const [key, value] of Object.entries(values))
          data.set(key, value ?? "");
        response = await fetch("/api/professionals/photo", {
          method: "POST",
          body: data,
        });
      } else
        response = await fetch(`/api/professionals/${professional.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, establishmentId: business.id }),
        });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFile(undefined);
      form.reset(values);
      notify.success(
        "Alterações salvas",
        "Os dados do profissional foram atualizados.",
      );
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível salvar as alterações.",
      );
    }
  }
  return (
    <FormProvider {...form}>
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Editar profissional"
        className="relative mb-5 flex gap-5 overflow-x-auto border-b border-[#e8e5f0] sm:gap-7"
      >
        {tabs.map(({ value, label, icon: Icon }, index) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`professional-tab-${value}`}
            aria-selected={tab === value}
            aria-controls={`professional-panel-${value}`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => void setTab(value)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
              else if (event.key === "ArrowLeft")
                next = (index + tabs.length - 1) % tabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = tabs.length - 1;
              else return;
              event.preventDefault();
              void setTab(tabs[next].value);
              document
                .getElementById(`professional-tab-${tabs[next].value}`)
                ?.focus();
            }}
            className={`relative inline-flex min-h-12 shrink-0 items-center justify-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#635BFF] ${tab === value ? "border-transparent text-[#635BFF]" : "border-transparent text-zinc-500 hover:border-[#ded9ef] hover:text-zinc-800"}`}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
        {indicator && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-0.5 rounded-full bg-[#635BFF] transition-[transform,width] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
            style={{
              width: indicator.width,
              transform: `translateX(${indicator.left}px)`,
            }}
          />
        )}
      </div>
      <div className="form-page-grid w-full gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div ref={panelsRef} className="min-w-0">
          <div
            role="tabpanel"
            id="professional-panel-dados"
            aria-labelledby="professional-tab-dados"
            hidden={tab !== "dados"}
            tabIndex={0}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] rounded-2xl"
          >
            <form
              noValidate
              className="internal-form [&_.internal-form-section]:px-5 [&_.internal-form-section]:py-5 sm:[&_.internal-form-section]:px-6 [&_.internal-form-section>header]:mb-4 [&_.internal-form-section>header]:min-h-14 [&_.internal-form-section>header]:pt-0 [&_.section-watermark]:text-5xl [&_.form-section-fields]:gap-3"
              aria-busy={busy}
              onSubmit={form.handleSubmit(submit)}
            >
              <p className="px-5 pt-4 text-xs text-zinc-500 sm:px-6">
                Todos os campos marcados com{" "}
                <span className="text-red-600">*</span> são obrigatórios.
              </p>
              <FormSection
                number="01"
                title="Quem faz parte da sua equipe?"
                description="Atualize a identificação do profissional na sua página de agendamentos."
              >
                <div className="grid items-center gap-4 sm:grid-cols-[192px_minmax(0,1fr)] sm:gap-5">
                  <div>
                    <ProfessionalPhoto
                      name={name}
                      establishmentId={business.id}
                      professionalId={professional.id}
                      initialUrl={professional.photoUrl}
                      onFileChange={setFile}
                      onBusyChange={setPhotoBusy}
                    />
                  </div>
                  <label className="form-field">
                    Nome do profissional <span className="text-red-600">*</span>
                    <input
                      {...form.register("name")}
                      maxLength={150}
                      autoComplete="name"
                      aria-invalid={!!form.formState.errors.name}
                      aria-describedby={
                        form.formState.errors.name ? "error-name" : undefined
                      }
                    />
                    <FieldError name="name" />
                  </label>
                </div>
              </FormSection>
              <FormSection
                number="02"
                title="O ritmo dos atendimentos"
                description="Defina se o profissional está disponível ou precisa de uma pausa."
              >
                <label className="form-field">
                  Status <span className="text-red-600">*</span>
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field }) => (
                      <FlowSelect
                        aria-label="Status do profissional"
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                        <option value="vacation">Férias</option>
                      </FlowSelect>
                    )}
                  />
                  <FieldError name="status" />
                </label>
                {status === "vacation" ? (
                  <div className="mt-0">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="form-field">
                        Início das férias{" "}
                        <span className="text-red-600">*</span>
                        <FormDate name="start" />
                        <FieldError name="start" />
                      </label>
                      <label className="form-field">
                        Término das férias{" "}
                        <span className="text-red-600">*</span>
                        <FormDate name="end" />
                        <FieldError name="end" />
                      </label>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      As duas datas estão incluídas. Novas reservas ficam
                      bloqueadas no período e a disponibilidade volta
                      automaticamente no dia seguinte ao término.
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                    {status === "inactive"
                      ? "Novas reservas ficam pausadas. Os agendamentos existentes permanecem na agenda."
                      : "O profissional pode receber novas reservas conforme os serviços e horários disponíveis."}
                  </p>
                )}
              </FormSection>

              <div className="internal-form-footer px-5 py-4 sm:px-6">
                <Link href={back} className="form-cancel">
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={busy || photoBusy}
                  className="button"
                >
                  {busy ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Salvando…
                    </>
                  ) : (
                    <>
                      Salvar alterações
                      <AnimatedArrow size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          <div
            role="tabpanel"
            id="professional-panel-horarios"
            aria-labelledby="professional-tab-horarios"
            hidden={tab !== "horarios"}
            tabIndex={0}
            className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] [&>section]:mt-0"
          >
            <ProfessionalSchedule
              professionalId={professional.id}
              establishmentId={business.id}
              timezone={business.timezone}
              schedule={schedule}
            />
          </div>
          <div
            role="tabpanel"
            id="professional-panel-perigo"
            aria-labelledby="professional-tab-perigo"
            hidden={tab !== "perigo"}
            tabIndex={0}
            className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF]"
          >
            <section
              aria-labelledby="professional-danger-zone"
              className="relative isolate overflow-hidden rounded-2xl border border-[#eadde2] bg-white"
            >
              <ShieldAlert
                aria-hidden="true"
                className="pointer-events-none absolute -right-7 -bottom-9 -z-10 size-56 rotate-[-12deg] text-[#a45e75] opacity-[0.06]"
              />
              <div className="border-b border-[#f0e8ec] px-5 py-3 sm:px-6">
                <h2
                  id="professional-danger-zone"
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a45e75]"
                >
                  Zona de perigo
                </h2>
              </div>
              <div className="flex flex-col items-start gap-4 px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-lg">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Excluir profissional
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                    Remove o profissional da equipe e impede novas reservas. O
                    histórico dos atendimentos será preservado.
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-[#a45e75]">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
                <ProfessionalDelete
                  id={professional.id}
                  establishmentId={business.id}
                  name={professional.name}
                  redirectTo={back}
                />
              </div>
            </section>
          </div>
        </div>
        <aside className="form-companion hidden lg:block">
          <div className="form-companion-card relative overflow-hidden p-5 [&_h3]:my-2">
            <Users
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -bottom-8 size-48 rotate-[-12deg] text-[#635BFF] opacity-[0.06]"
            />
            <small>SUA EQUIPE, EM SINTONIA</small>
            <h3>Pessoas que fazem a diferença.</h3>
            <p>
              Mantenha os dados e a disponibilidade de cada profissional em dia.
            </p>
          </div>
          <div className="form-tip gap-2 py-3">
            <Info size={17} />
            <div>
              <strong>{business.name}</strong>
              <p>As alterações só entram em vigor quando você salvar.</p>
            </div>
          </div>
          <div className="form-tip">
            <CalendarDays size={17} />
            <div>
              <strong>Uma agenda organizada</strong>
              <p>
                Resolva as reservas futuras antes de excluir o profissional ou
                definir férias que coincidam com atendimentos.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </FormProvider>
  );
}
