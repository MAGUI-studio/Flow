"use client";
import { BusinessBanner } from "./business-banner";
import { Weekday } from "./professional-schedule";
import { emptyWeeklySchedule, weekdays } from "@/lib/weekly-schedule";
import { notify, useToastError } from "@/components/ui/flow-toaster";
import { formValidation } from "@/lib/form-validation";
import { ProfessionalPhoto } from "./professional-photo";
import { AnimatedArrow } from "@/components/ui/animated-arrow";
import { useEffect, useState, type ReactNode } from "react";
import { businessSlug } from "@/lib/business-slug";
import { appAddress } from "@/lib/app-url";
import { businessBioMaxLength } from "@/lib/business-categories";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HeartIcon as Heart,
  StethoscopeIcon as Stethoscope,
  GraduationCapIcon as GraduationCap,
  BriefcaseIcon as BriefcaseBusiness,
  SparkleIcon as Sparkles,
  CheckIcon as Check,
  InfoIcon as Info,
  CircleNotchIcon as LoaderCircle,
  ScissorsIcon as Scissors,
  UsersIcon as Users,
  GlobeIcon as Globe,
  MapPinIcon as MapPin,
  LightningIcon as Zap,
  ClipboardTextIcon as ClipboardCheck,
  ClockIcon as Clock,
  LockKeyIcon as LockKeyhole,
  PenNibIcon as PenTool,
  FlowerIcon as Flower2,
  BarbellIcon as Dumbbell,
  PawPrintIcon as PawPrint,
  CameraIcon as Camera,
} from "@phosphor-icons/react";
import { FormSection } from "./primitives";
import { AddressFields } from "./address-fields";
import { BusinessMonogram } from "@/components/ui/business-monogram";
import {
  FormSelect as FlowSelect,
  FormDate as FlowDate,
  FormTime as FlowTime,
  FieldError,
} from "@/components/ui/form-controls";
import {
  FormProvider,
  useForm,
  useFormContext,
  useController,
  type FieldValues,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { businessSchemas, establishmentSchema } from "@/lib/form-schemas";
import { phoneMask, currencyMask, currencyCents } from "@/lib/masks";

import { panelHref } from "@/lib/url-state";
export type FormKind =
  "establishment" | "professional" | "service" | "availability" | "session";
export type FormBusiness = { id: string; name: string; timezone: string };
export type FormProfessional = { id: string; name: string };
export type FormService = {
  id: string;
  name: string;
  durationMinutes: number;
  professionals: { professionalId: string }[];
};
const destinations: Record<FormKind, string> = {
  establishment: "/painel/estabelecimentos",
  professional: "/painel/profissionais",
  service: "/painel/servicos",
  availability: "/painel/profissionais",
  session: "/painel/sessoes",
};
function Choice({
  name,
  value,
  title,
  description,
  icon,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  title: string;
  description: string;
  icon: ReactNode;
  checked?: boolean;
  onChange?: () => void;
}) {
  const { control } = useFormContext();
  const { field } = useController({ name, control });
  return (
    <label className="choice-tile relative isolate overflow-hidden p-5 has-checked:border-[#635BFF] has-checked:bg-[#F5F4FF]">
      <input
        type="radio"
        name={field.name}
        ref={field.ref}
        onBlur={field.onBlur}
        value={value}
        checked={field.value === undefined ? !!checked : field.value === value}
        onChange={() => {
          field.onChange(value);
          onChange?.();
        }}
      />
      <span
        className="choice-tile-icon pointer-events-none absolute -right-3 -bottom-5 -z-10 block rotate-[-12deg] opacity-10 [&_svg]:size-24 [&_svg]:stroke-[1.3]"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <i>
        <Check size={12} />
      </i>
    </label>
  );
}
export type EditableService = {
  id: string;
  name: string;
  kind: "individual" | "collective";
  modality: "in_person" | "online";
  durationMinutes: number;
  stepMinutes: number;
  bufferBefore: number;
  bufferAfter: number;
  price: string;
  free: boolean;
  professionalIds: string[];
};
export function BusinessForm({
  kind,
  business,
  professionals = [],
  services = [],
  initialService,
  initialEstablishment,
}: {
  kind: FormKind;
  initialEstablishment?: {
    id: string;
    coverUrl?: string | null;
    [key: string]: unknown;
  };
  initialService?: EditableService;
  business?: FormBusiness;
  professionals?: FormProfessional[];
  services?: FormService[];
}) {
  const [savedServiceId, setSavedServiceId] = useState(initialService?.id);
  const setError = useToastError();
  const router = useRouter();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [professionalPhotoFile, setProfessionalPhotoFile] = useState<File>();
  const [bannerFile, setBannerFile] = useState<File>();
  const [bannerPreview, setBannerPreview] = useState(
    initialEstablishment?.coverUrl ?? "",
  );
  const methods = useForm<FieldValues>({
    ...formValidation,
    mode: kind === "establishment" ? "onTouched" : formValidation.mode,
    resolver: zodResolver(
      businessSchemas[kind] as z.ZodType<FieldValues, FieldValues>,
    ) as Resolver<FieldValues>,
    defaultValues: {
      name: "",
      photoId: "",
      days: emptyWeeklySchedule().days,
      slug: "",
      category: "",
      description: "",
      city: "",
      address: "",
      addressDetails: {
        postalCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
      contactPhone: "",
      website: "",
      instagram: "",
      bannerId: undefined,
      approvalMode: "automatic",
      cancelNoticeHours: 2,
      kind: "individual",
      modality: "in_person",
      durationMinutes: 30,
      stepMinutes: 30,
      bufferBefore: 0,
      bufferAfter: 0,
      price: "",
      free: false,
      professionalIds: [],
      professionalId: "",
      date: "",
      start: "",
      end: "",
      mode: "open",
      serviceId: "",
      capacity: 10,
      ...initialService,
      ...initialEstablishment,
    },
  });
  const {
    register: registerField,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting: busy },
  } = methods;
  const register: typeof registerField = (name, options) => ({
    ...registerField(name, options),
    "aria-invalid": !!methods.formState.errors[name],
    "aria-describedby": methods.formState.errors[name]
      ? `error-${name}`
      : undefined,
  });
  const [canEditSlug, setCanEditSlug] = useState(false);
  const [verifiedSlug, setVerifiedSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState("");
  const [slugCheckVersion, setSlugCheckVersion] = useState(0);
  const name = watch("name") as string,
    slug = watch("slug") as string,
    format = watch("kind") as string,
    free = watch("free") as boolean,
    serviceId = watch("serviceId") as string;
  const validEstablishment =
    kind !== "establishment" || establishmentSchema.safeParse(watch()).success;
  const slugReady =
    kind !== "establishment" ||
    !!initialEstablishment ||
    verifiedSlug === JSON.stringify([name, slug]);
  const setName = (v: string) =>
    setValue("name", v, { shouldValidate: methods.formState.isSubmitted });
  const setSlug = (v: string) =>
    setValue("slug", v, { shouldValidate: methods.formState.isSubmitted });
  useEffect(() => {
    if (
      kind !== "establishment" ||
      initialEstablishment ||
      !name.trim() ||
      !slug
    ) {
      setSlugStatus("");
      return;
    }
    const controller = new AbortController();
    setVerifiedSlug("");
    setSlugStatus("Verificando endereço…");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/establishment-slug?${new URLSearchParams({ name, slug })}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error(data.error);
        setCanEditSlug(data.canEdit);
        if (data.available) setVerifiedSlug(JSON.stringify([name, slug]));
        setSlugStatus(
          data.available
            ? "Endereço disponível."
            : "Este endereço já está em uso. Escolha outro endereço para sua página.",
        );
        if (!data.available)
          methods.setError("slug", {
            type: "availability",
            message: "Este endereço já está em uso.",
          });
        else if (methods.getFieldState("slug").error?.type === "availability")
          methods.clearErrors("slug");
      } catch (error) {
        if (!controller.signal.aborted)
          setSlugStatus(
            error instanceof Error
              ? error.message
              : "Não foi possível verificar o endereço.",
          );
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, name, slug, methods, slugCheckVersion]);
  const setFormat = (v: string) => setValue("kind", v);
  const setFree = (v: boolean) => setValue("free", v);
  const setServiceId = (v: string) => {
    setValue("serviceId", v);
    setValue("professionalId", "");
  };
  const back = panelHref(destinations[kind], business?.id);
  const selectedService = services.find((s) => s.id === serviceId);
  const matchingProfessionals =
    kind === "session"
      ? professionals.filter((p) =>
          selectedService?.professionals.some(
            (link) => link.professionalId === p.id,
          ),
        )
      : professionals;
  async function submit(values: FieldValues) {
    if (photoBusy) return;
    const input: Record<string, unknown> = {
      ...values,
      type: kind,
      establishmentId: business?.id,
    };
    if (kind === "service")
      input.priceCents = free ? 0 : currencyCents(values.price);
    if (kind === "availability") input.block = values.mode === "block";
    setError("");
    try {
      if (kind === "establishment" && !initialEstablishment) {
        const check = await fetch(
          `/api/establishment-slug?${new URLSearchParams({ name: String(values.name), slug: String(values.slug) })}`,
          { cache: "no-store" },
        );
        const checked = await check.json();
        if (!check.ok) throw new Error(checked.error);
        setCanEditSlug(checked.canEdit);
        if (!checked.available) {
          methods.setError(
            "slug",
            {
              type: "availability",
              message: "Este endereço já está em uso. Escolha outro.",
            },
            { shouldFocus: true },
          );
          return;
        }
      }
      if (kind === "establishment" && bannerFile) {
        const uploadForm = new FormData();
        uploadForm.set("file", bannerFile);
        const uploadResponse = await fetch("/api/business-banner", {
          method: "POST",
          body: uploadForm,
        });
        const banner = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(banner.error);
        input.bannerId = banner.id;
        setValue("bannerId", banner.id, { shouldDirty: true });
        setBannerFile(undefined);
      }
      const photoForm =
        kind === "professional" && professionalPhotoFile
          ? new FormData()
          : null;
      if (photoForm) {
        photoForm.set("file", professionalPhotoFile!);
        photoForm.set("establishmentId", business!.id);
        photoForm.set("name", String(values.name));
        photoForm.set("days", JSON.stringify(values.days));
      }
      const response = await fetch(
        photoForm
          ? "/api/professionals/photo"
          : kind === "service" && savedServiceId
            ? `/api/services/${savedServiceId}`
            : initialEstablishment
              ? `/api/establishments/${initialEstablishment.id}`
              : "/api/manage",
        photoForm
          ? {
              method: "POST",
              body: photoForm,
            }
          : {
              method:
                initialEstablishment || (kind === "service" && savedServiceId)
                  ? "PATCH"
                  : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      notify.success(
        kind === "professional"
          ? "Profissional adicionado"
          : kind === "establishment"
            ? initialEstablishment
              ? "Alterações salvas"
              : "Estabelecimento criado"
            : kind === "service"
              ? savedServiceId
                ? "Alterações salvas"
                : "Serviço cadastrado"
              : kind === "availability"
                ? "Disponibilidade salva"
                : "Sessão criada",
      );
      if (kind === "service") {
        setSavedServiceId(data.id);
        methods.reset(values);
        router.refresh();
        return;
      }
      router.push(
        panelHref(
          destinations[kind],
          kind === "establishment" ? data.id : business?.id,
        ),
      );
      router.refresh();
    } catch (e) {
      if (kind === "establishment") setSlugCheckVersion((v) => v + 1);
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }
  const professionalField = (
    <label className="form-field">
      Profissional <span className="required-mark text-red-600">*</span>
      <FlowSelect
        name="professionalId"
        required
        key={kind === "session" ? serviceId : "professional"}
        disabled={!matchingProfessionals.length}
      >
        <option value="">
          {kind === "session" && !serviceId
            ? "Escolha um serviço primeiro"
            : "Quem vai atender?"}
        </option>
        {matchingProfessionals.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </FlowSelect>
      <FieldError name="professionalId" />
    </label>
  );
  return (
    <FormProvider {...methods}>
      <div
        className={`form-page-grid w-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px] ${kind === "professional" ? "gap-5" : ""}`}
      >
        <form
          className={
            kind === "professional"
              ? "internal-form [&_.internal-form-section]:px-5 [&_.internal-form-section]:py-5 sm:[&_.internal-form-section]:px-6 [&_.internal-form-section>header]:mb-4 [&_.internal-form-section>header]:min-h-14 [&_.internal-form-section>header]:pt-0 [&_.section-watermark]:text-5xl [&_.form-section-fields]:gap-3"
              : "internal-form"
          }
          noValidate
          onSubmit={handleSubmit(submit)}
          aria-busy={busy}
        >
          <p
            className={
              kind === "professional"
                ? "px-5 pt-4 text-xs text-zinc-500 sm:px-6"
                : "px-5 pt-5 text-xs text-zinc-500 sm:px-8 sm:pt-6"
            }
          >
            Todos os campos marcados com <span className="text-red-600">*</span>{" "}
            são obrigatórios.
          </p>
          {kind === "establishment" ? (
            <>
              <FormSection
                number="01"
                title="A identidade do seu negócio"
                description="É assim que seus clientes vão encontrar você no Flow."
              >
                <label className="form-field">
                  Nome do estabelecimento{" "}
                  <span className="required-mark text-red-600">*</span>
                  <input
                    {...register("name")}
                    required
                    maxLength={150}
                    placeholder="Ex.: Studio Aurora"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setCanEditSlug(false);
                      if (!initialEstablishment)
                        setSlug(businessSlug(e.target.value));
                    }}
                    autoComplete="organization"
                  />
                  <FieldError name="name" />
                </label>
                <label className="form-field">
                  Endereço da sua página{" "}
                  <span className="required-mark text-red-600">*</span>
                  <div
                    className={`slug-field flex min-h-12 items-center gap-2 overflow-hidden rounded-xl border border-zinc-200 px-3 py-0 transition-opacity focus-within:border-[#635BFF] ${canEditSlug ? "opacity-100" : "bg-zinc-50 opacity-60"}`}
                  >
                    <span className="shrink-0 bg-transparent p-0 text-xs text-zinc-400">
                      {appAddress}/
                    </span>
                    <input
                      {...(canEditSlug ? register("slug") : {})}
                      className="m-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 py-3 shadow-none outline-none focus:shadow-none"
                      required
                      minLength={3}
                      maxLength={70}
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      placeholder="seu-negocio"
                      value={slug}
                      readOnly={!canEditSlug}
                      disabled={!canEditSlug}
                      onChange={(e) => {
                        if (canEditSlug) setSlug(e.target.value);
                      }}
                    />
                    {!canEditSlug && (
                      <input type="hidden" {...register("slug")} value={slug} />
                    )}
                    {!canEditSlug && (
                      <LockKeyhole
                        aria-hidden="true"
                        size={16}
                        className="shrink-0 text-zinc-400"
                      />
                    )}
                  </div>
                  <small className="field-help">
                    {canEditSlug
                      ? "Use letras minúsculas, números e hífens para diferenciar sua página."
                      : "Definido automaticamente pelo nome do estabelecimento."}
                  </small>
                  {slugStatus && !methods.formState.errors.slug && (
                    <small
                      role="status"
                      className="mt-1 block text-xs text-zinc-500"
                    >
                      {slugStatus}
                    </small>
                  )}
                  <FieldError name="slug" />
                </label>
                <fieldset className="category-field m-0 min-w-0 border-0 p-0 text-xs text-zinc-600 [&_legend]:mb-3">
                  <legend>
                    Categoria{" "}
                    <span className="required-mark text-red-600">*</span>
                  </legend>
                  <p className="mb-4 text-xs leading-relaxed text-zinc-500">
                    Escolha a área que melhor representa o seu negócio.
                  </p>
                  <div className="category-cards grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {[
                      {
                        name: "Beleza",
                        icon: Sparkles,
                        description: "Salões e cuidados pessoais",
                      },
                      {
                        name: "Barbearia",
                        icon: Scissors,
                        description: "Cabelo, barba e estilo",
                      },
                      {
                        name: "Saúde",
                        icon: Stethoscope,
                        description: "Clínicas e consultórios",
                      },
                      {
                        name: "Bem-estar",
                        icon: Heart,
                        description: "Movimento e equilíbrio",
                      },
                      {
                        name: "Educação",
                        icon: GraduationCap,
                        description: "Aulas e aprendizado",
                      },
                      {
                        name: "Consultoria",
                        icon: BriefcaseBusiness,
                        description: "Orientação e estratégia",
                      },
                      {
                        name: "Tatuagem",
                        icon: PenTool,
                        description: "Arte e expressão na pele",
                      },
                      {
                        name: "Estética",
                        icon: Flower2,
                        description: "Tratamentos faciais e corporais",
                      },
                      {
                        name: "Esportes",
                        icon: Dumbbell,
                        description: "Treinos e práticas esportivas",
                      },
                      {
                        name: "Pet",
                        icon: PawPrint,
                        description: "Cuidado com os animais",
                      },
                      {
                        name: "Fotografia",
                        icon: Camera,
                        description: "Ensaios e sessões de fotos",
                      },
                      {
                        name: "Outro",
                        icon: Globe,
                        description: "Outras formas de atender",
                      },
                    ].map((c) => (
                      <label
                        key={c.name}
                        className={`category-card group relative isolate flex min-h-36 cursor-pointer flex-col justify-end overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4 pt-14 transition-[border-color,box-shadow,background-color] duration-200 hover:border-zinc-400 hover:shadow-sm has-checked:border-[#635BFF] has-checked:bg-[#F5F4FF] has-checked:ring-1 has-checked:ring-[#635BFF] has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-[#635BFF]`}
                      >
                        <input
                          className="peer sr-only"
                          type="radio"
                          required
                          {...register("category")}
                          value={c.name}
                        />
                        <c.icon
                          aria-hidden="true"
                          className="pointer-events-none absolute -top-2 -right-3 -z-10 size-28 rotate-[-12deg] stroke-[1.1] text-zinc-900 opacity-[0.055] transition-opacity group-hover:opacity-[0.08] peer-checked:text-[#635BFF] peer-checked:opacity-[0.09]"
                        />
                        <strong className="text-sm font-semibold tracking-tight text-zinc-800 peer-checked:text-[#5046E5]">
                          {c.name}
                        </strong>
                        <span className="mt-1.5 max-w-36 text-[10px] leading-relaxed text-zinc-500">
                          {c.description}
                        </span>
                        <i
                          aria-hidden="true"
                          className="absolute top-4 left-4 grid size-5 place-items-center rounded-full border border-zinc-300 bg-white text-transparent transition-colors peer-checked:border-[#635BFF] peer-checked:bg-[#635BFF] peer-checked:text-white"
                        >
                          <Check size={12} />
                        </i>
                      </label>
                    ))}
                  </div>
                  <FieldError name="category" />
                </fieldset>
                <label className="form-field">
                  Sobre o seu espaço (opcional)
                  <textarea
                    {...register("description")}
                    maxLength={businessBioMaxLength}
                    aria-describedby="business-bio-help business-bio-count error-description"
                    rows={4}
                    placeholder="Conte o que torna o seu atendimento especial."
                  />
                  <div className="flex items-start justify-between gap-4">
                    <small id="business-bio-help" className="field-help">
                      Uma apresentação breve ajuda os clientes a conhecerem seu
                      negócio.
                    </small>
                    <small
                      id="business-bio-count"
                      className={`mt-2 shrink-0 text-[10px] tabular-nums ${String(watch("description") ?? "").length >= businessBioMaxLength ? "text-[#635BFF]" : "text-zinc-400"}`}
                    >
                      {String(watch("description") ?? "").length}/
                      {businessBioMaxLength}
                    </small>
                  </div>
                  <FieldError name="description" />
                </label>
              </FormSection>
              <FormSection
                number="02"
                title="A primeira impressão do seu espaço"
                description="Escolha uma imagem de capa para sua página e para os cards do Flow."
              >
                <BusinessBanner
                  initialUrl={initialEstablishment?.coverUrl}
                  onBusyChange={setPhotoBusy}
                  onChange={(file, previewUrl) => {
                    setBannerPreview(previewUrl);
                    setBannerFile(file ?? undefined);
                    setValue("bannerId", file ? undefined : "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <FieldError name="bannerId" />
              </FormSection>
              <FormSection
                number="03"
                title="Onde e como encontrar você"
                description="Informe os contatos e a localização do seu atendimento."
              >
                <div className="fields-grid">
                  <label className="form-field">
                    Site (opcional)
                    <input
                      {...register("website")}
                      placeholder="https://seusite.com.br"
                      autoComplete="url"
                    />
                    <FieldError name="website" />
                  </label>
                  <label className="form-field">
                    Instagram (opcional)
                    <input
                      {...register("instagram")}
                      placeholder="@seuestabelecimento"
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                    <FieldError name="instagram" />
                  </label>
                  <label className="form-field">
                    WhatsApp de contato (opcional)
                    <input
                      {...register("contactPhone", {
                        onChange: (e) =>
                          setValue("contactPhone", phoneMask(e.target.value)),
                      })}
                      inputMode="tel"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                    />
                    <FieldError name="contactPhone" />
                  </label>
                </div>
                <AddressFields />
              </FormSection>
              <FormSection
                number="04"
                title="Seu jeito de organizar a agenda"
                description="Defina como as reservas chegam até você."
              >
                <fieldset className="m-0 min-w-0 border-0 p-0">
                  <legend className="mb-3 text-xs font-medium text-zinc-600">
                    Confirmação das reservas{" "}
                    <span className="text-red-600">*</span>
                  </legend>
                  <div className="choice-tiles">
                    <Choice
                      name="approvalMode"
                      value="automatic"
                      title="Confirmação automática"
                      description="O horário é confirmado assim que o cliente agenda."
                      icon={<Zap size={19} />}
                      checked
                    />
                    <Choice
                      name="approvalMode"
                      value="manual"
                      title="Aprovação manual"
                      description="Você analisa cada pedido em até 24 horas."
                      icon={<ClipboardCheck size={19} />}
                    />
                  </div>
                </fieldset>
                <label className="form-field compact-field">
                  Prazo para cancelar (horas){" "}
                  <span className="text-red-600">*</span>
                  <input
                    {...register("cancelNoticeHours")}
                    type="number"
                    required
                    min={0}
                    max={720}
                    defaultValue={2}
                  />
                  <small className="field-help">
                    Depois desse prazo, o cliente precisa falar diretamente com
                    você.
                  </small>
                  <FieldError name="cancelNoticeHours" />
                </label>
              </FormSection>
            </>
          ) : kind === "professional" ? (
            <>
              <FormSection
                number="01"
                title="Quem faz parte da sua equipe?"
                description="O nome aparece para o cliente ao escolher quem vai atender."
              >
                <div className="grid items-center gap-4 sm:grid-cols-[192px_minmax(0,1fr)] sm:gap-5">
                  <div>
                    <ProfessionalPhoto
                      name={name}
                      establishmentId={business!.id}
                      onFileChange={setProfessionalPhotoFile}
                      onChange={(id) =>
                        setValue("photoId", id, {
                          shouldDirty: true,
                          shouldValidate: methods.formState.isSubmitted,
                        })
                      }
                      onBusyChange={setPhotoBusy}
                    />
                  </div>
                  <label className="form-field">
                    Nome do profissional{" "}
                    <span className="required-mark text-red-600">*</span>
                    <input
                      {...register("name")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={150}
                      placeholder="Ex.: Marina Costa"
                      autoComplete="off"
                      autoFocus
                    />
                    <small className="field-help">
                      Depois, vincule os serviços realizados por este
                      profissional.
                    </small>
                    <FieldError name="name" />
                  </label>
                </div>
              </FormSection>
              <FormSection
                number="02"
                title="Horários de atendimento"
                description="Selecione pelo menos um dia e defina os horários. A rotina se repete automaticamente toda semana."
              >
                <div className="space-y-3">
                  {weekdays.map((day, index) => (
                    <Weekday key={day} index={index} />
                  ))}
                </div>
                <FieldError name="days" />
              </FormSection>
            </>
          ) : kind === "service" ? (
            <>
              <FormSection
                number="01"
                title="O que você oferece?"
                description="Um nome claro ajuda o cliente a escolher o atendimento certo."
              >
                <label className="form-field">
                  Nome do serviço{" "}
                  <span className="required-mark text-red-600">*</span>
                  <input
                    {...register("name")}
                    required
                    maxLength={150}
                    placeholder="Ex.: Corte e finalização"
                  />
                  <FieldError name="name" />
                </label>
                <div className="choice-tiles">
                  <Choice
                    name="kind"
                    value="individual"
                    title="Individual"
                    description="Um cliente por horário e profissional."
                    checked
                    icon={<Users size={19} />}
                    onChange={() => setFormat("individual")}
                  />
                  <Choice
                    name="kind"
                    value="collective"
                    title="Em grupo"
                    description="Várias pessoas na mesma sessão."
                    icon={<Users size={19} />}
                    onChange={() => setFormat("collective")}
                  />
                </div>
                <div className="choice-tiles">
                  <Choice
                    name="modality"
                    value="in_person"
                    title="Presencial"
                    description="O cliente vai até o seu espaço."
                    checked
                    icon={<MapPin size={19} />}
                  />
                  <Choice
                    name="modality"
                    value="online"
                    title="Online"
                    description="Você combina o acesso pelo WhatsApp."
                    icon={<Globe size={19} />}
                  />
                </div>
              </FormSection>
              <FormSection
                number="02"
                title="Tempo e valor"
                description="Organize a duração e os intervalos do seu atendimento."
              >
                <div className="fields-grid">
                  <label className="form-field">
                    Duração (minutos){" "}
                    <span className="required-mark text-red-600">*</span>
                    <input
                      {...register("durationMinutes")}
                      type="number"
                      min={5}
                      max={1440}
                      defaultValue={30}
                      required
                    />
                    <small className="field-help">
                      O tempo total do atendimento.
                    </small>
                    <FieldError name="durationMinutes" />
                  </label>
                  <label className="form-field">
                    Inícios a cada (minutos)
                    <input
                      {...register("stepMinutes")}
                      type="number"
                      min={5}
                      max={1440}
                      defaultValue={30}
                    />
                    <small className="field-help">
                      Ex.: 30 oferece 09:00, 09:30, 10:00…
                    </small>
                    <FieldError name="stepMinutes" />
                  </label>
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <label className="form-field">
                    Valor do serviço (R$)
                    <input
                      {...register("price", {
                        onChange: (e) =>
                          setValue("price", currencyMask(e.target.value)),
                      })}
                      type="text"
                      inputMode="decimal"
                      min={0}
                      max={1000000}
                      placeholder="0,00"
                      required={!free}
                      disabled={free}
                    />
                    <FieldError name="price" />
                  </label>
                  <label className="group inline-flex w-fit max-w-full min-h-10 cursor-pointer items-center gap-2.5 self-start text-xs font-medium text-zinc-500">
                    <input
                      {...register("free")}
                      type="checkbox"
                      checked={free}
                      onChange={(e) => setFree(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="grid size-5 shrink-0 place-items-center rounded-lg border border-[#dcd8e9] bg-white text-transparent shadow-xs transition-colors group-hover:border-[#635BFF]/50 peer-checked:border-[#635BFF] peer-checked:bg-[#635BFF] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[#635BFF]"
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                    Este serviço é gratuito
                  </label>
                </div>
                <div className="fields-grid">
                  <label className="form-field">
                    Preparação antes (minutos)
                    <input
                      {...register("bufferBefore")}
                      type="number"
                      min={0}
                      max={240}
                      defaultValue={0}
                    />
                    <FieldError name="bufferBefore" />
                  </label>
                  <label className="form-field">
                    Intervalo depois (minutos)
                    <input
                      {...register("bufferAfter")}
                      type="number"
                      min={0}
                      max={240}
                      defaultValue={0}
                    />
                    <FieldError name="bufferAfter" />
                  </label>
                </div>
                {format === "collective" && (
                  <div className="inline-information">
                    <Info size={16} />
                    As vagas e datas de cada turma são definidas em Sessões em
                    grupo, depois de cadastrar o serviço.
                  </div>
                )}
              </FormSection>
              <FormSection
                number="03"
                title="Quem realiza este serviço?"
                description="Selecione os profissionais que estarão disponíveis para este atendimento."
              >
                <div className="professional-checkbox-grid">
                  {professionals.map((p) => (
                    <label className="professional-checkbox" key={p.id}>
                      <input
                        {...register("professionalIds")}
                        type="checkbox"
                        value={p.id}
                      />
                      <span>
                        {p.name
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")}
                      </span>
                      <strong>{p.name}</strong>
                      <i>
                        <Check size={13} />
                      </i>
                    </label>
                  ))}
                </div>
                <FieldError name="professionalIds" />
              </FormSection>
            </>
          ) : kind === "availability" ? (
            <>
              <FormSection
                number="01"
                title="Organize o tempo da sua equipe"
                description="Abra um período para reservas ou bloqueie uma pausa."
              >
                <div className="choice-tiles">
                  <Choice
                    name="mode"
                    value="open"
                    title="Abrir horários"
                    description="Os clientes poderão reservar neste período."
                    icon={<Clock size={19} />}
                    checked
                  />
                  <Choice
                    name="mode"
                    value="block"
                    title="Bloquear período"
                    description="Reserve uma pausa, folga ou compromisso."
                    icon={<ClipboardCheck size={19} />}
                  />
                </div>
                {professionalField}
              </FormSection>
              <FormSection
                number="02"
                title="Escolha o período"
                description="Cada período vale para a data escolhida. Você pode abrir datas futuras."
              >
                <label className="form-field">
                  Data <span className="required-mark text-red-600">*</span>
                  <FlowDate name="date" required />
                  <FieldError name="date" />
                </label>
                <div className="fields-grid">
                  <label className="form-field">
                    A partir de{" "}
                    <span className="required-mark text-red-600">*</span>
                    <FlowTime name="start" required />
                    <FieldError name="start" />
                  </label>
                  <label className="form-field">
                    Até <span className="required-mark text-red-600">*</span>
                    <FlowTime name="end" required />
                    <FieldError name="end" />
                  </label>
                </div>
                <div className="inline-information">
                  <Info size={16} />
                  Para um almoço das 12h às 13h, abra períodos separados antes e
                  depois da pausa.
                </div>
              </FormSection>
            </>
          ) : (
            <>
              <FormSection
                number="01"
                title="O próximo encontro da sua turma"
                description="Defina o serviço e quem vai conduzir esta sessão."
              >
                <label className="form-field">
                  Serviço coletivo{" "}
                  <span className="required-mark text-red-600">*</span>
                  <FlowSelect
                    name="serviceId"
                    required
                    value={serviceId}
                    onValueChange={setServiceId}
                  >
                    <option value="">Escolha um serviço</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.durationMinutes} min
                      </option>
                    ))}
                  </FlowSelect>
                  <FieldError name="serviceId" />
                </label>
                {professionalField}
              </FormSection>
              <FormSection
                number="02"
                title="Data, início e vagas"
                description="A sessão precisa estar dentro de um período aberto na agenda do profissional."
              >
                <div className="fields-grid">
                  <label className="form-field">
                    Data <span className="required-mark text-red-600">*</span>
                    <FlowDate name="date" required />
                    <FieldError name="date" />
                  </label>
                  <label className="form-field">
                    Começa às{" "}
                    <span className="required-mark text-red-600">*</span>
                    <FlowTime name="start" required />
                    <FieldError name="start" />
                  </label>
                </div>
                <label className="form-field compact-field">
                  Capacidade da turma{" "}
                  <span className="required-mark text-red-600">*</span>
                  <input
                    {...register("capacity")}
                    type="number"
                    min={1}
                    max={1000}
                    defaultValue={10}
                    required
                  />
                  <small className="field-help">
                    Cada reserva ocupa uma vaga. O Flow impede ultrapassar a
                    capacidade.
                  </small>
                  <FieldError name="capacity" />
                </label>
              </FormSection>
            </>
          )}

          <div
            className={
              kind === "professional"
                ? "internal-form-footer px-5 py-4 sm:px-6"
                : "internal-form-footer"
            }
          >
            <Link href={back} className="form-cancel">
              Cancelar
            </Link>
            <button
              className="button"
              disabled={busy || photoBusy || !validEstablishment || !slugReady}
              aria-describedby={
                kind === "establishment"
                  ? "establishment-submit-help"
                  : undefined
              }
            >
              {busy ? (
                <>
                  <LoaderCircle size={16} className="spinning" />
                  Salvando…
                </>
              ) : (
                <>
                  {kind === "establishment"
                    ? initialEstablishment
                      ? "Salvar alterações"
                      : "Criar estabelecimento"
                    : kind === "professional"
                      ? "Adicionar profissional"
                      : kind === "service"
                        ? savedServiceId
                          ? "Salvar alterações"
                          : "Cadastrar serviço"
                        : kind === "availability"
                          ? "Salvar período"
                          : "Criar sessão"}
                  <AnimatedArrow direction="right" size={16} />
                </>
              )}
            </button>
          </div>
          {kind === "establishment" && (
            <p
              id="establishment-submit-help"
              className="px-5 pb-4 text-xs text-zinc-500 sm:px-6"
              role="status"
            >
              {!validEstablishment
                ? "Preencha os campos obrigatórios (*) e confira os dados informados para salvar."
                : !slugReady
                  ? "Aguarde a confirmação de que o endereço da sua página está disponível."
                  : "Tudo pronto para salvar seu estabelecimento."}
            </p>
          )}
        </form>
        <aside className="form-companion hidden lg:block">
          <div
            className={
              kind === "professional"
                ? "form-companion-card relative overflow-hidden p-5 [&_h3]:my-2"
                : "form-companion-card"
            }
          >
            <span className="companion-spark">✳</span>
            <small>UM PASSO DE CADA VEZ</small>
            <h3>
              {kind === "establishment"
                ? "Seu negócio, com mais Flow."
                : kind === "professional"
                  ? "Pessoas que fazem a diferença."
                  : kind === "service"
                    ? "Cada detalhe faz parte do cuidado."
                    : "Uma agenda que respeita o seu ritmo."}
            </h3>
            <p>
              {kind === "establishment"
                ? "Crie sua página, organize sua equipe e comece a receber agendamentos."
                : "As informações ficam disponíveis na sua página assim que você salvar."}
            </p>
            {kind === "establishment" && (
              <div className="page-preview">
                <div className="relative mb-4 grid h-28 place-items-center overflow-hidden rounded-xl bg-[#e5dff0] pr-5">
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <BusinessMonogram name={name || "Flow"} />
                  )}
                </div>
                <strong>{name || "Nome do seu negócio"}</strong>
                <span>
                  {appAddress}/{slug || "seu-negocio"}
                </span>
              </div>
            )}
          </div>
          <div className="form-tip">
            <Info size={17} />
            <div>
              <strong>{business?.name ?? "Tudo sob seu controle"}</strong>
              <p>
                {kind === "availability" || kind === "session"
                  ? `Os horários seguem o fuso ${business?.timezone ?? "America/Sao_Paulo"}.`
                  : "Você gerencia tudo pela sua conta. Profissionais não precisam de login."}
              </p>
            </div>
          </div>
          {kind === "session" && (
            <Link
              className="internal-back"
              href={panelHref("/painel/profissionais", business?.id)}
            >
              Configurar os horários da equipe
              <AnimatedArrow direction="right" size={13} />
            </Link>
          )}
        </aside>
      </div>
    </FormProvider>
  );
}
