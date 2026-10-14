"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Stethoscope,
  GraduationCap,
  BriefcaseBusiness,
  Sparkles,
  ArrowRight,
  Check,
  Info,
  LoaderCircle,
  Scissors,
  Users,
  Globe,
  MapPin,
  Zap,
  ClipboardCheck,
  Clock,
} from "lucide-react";
import { FormSection } from "./primitives";
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
  type FieldValues,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { businessSchemas } from "@/lib/form-schemas";
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
  availability: "/painel/disponibilidade",
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
  const { register } = useFormContext();
  return (
    <label className="choice-tile relative isolate overflow-hidden p-5 has-checked:border-[#635BFF] has-checked:bg-[#F5F4FF]">
      <input
        type="radio"
        {...register(name)}
        value={value}
        defaultChecked={checked}
        onChange={(event) => {
          void register(name).onChange(event);
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
export function BusinessForm({
  kind,
  business,
  professionals = [],
  services = [],
}: {
  kind: FormKind;
  business?: FormBusiness;
  professionals?: FormProfessional[];
  services?: FormService[];
}) {
  const router = useRouter();
  const methods = useForm<FieldValues>({
    resolver: zodResolver(
      businessSchemas[kind] as z.ZodType<FieldValues, FieldValues>,
    ) as Resolver<FieldValues>,
    mode: "onTouched",
    defaultValues: {
      name: "",
      slug: "",
      category: "",
      description: "",
      city: "",
      address: "",
      contactPhone: "",
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
  const [error, setError] = useState(""),
    [slugEdited, setSlugEdited] = useState(false);
  const name = watch("name") as string,
    slug = watch("slug") as string,
    format = watch("kind") as string,
    free = watch("free") as boolean,
    serviceId = watch("serviceId") as string;
  const setName = (v: string) =>
    setValue("name", v, { shouldValidate: methods.formState.isSubmitted });
  const setSlug = (v: string) =>
    setValue("slug", v, { shouldValidate: methods.formState.isSubmitted });
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
      const response = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push(
        panelHref(
          destinations[kind],
          kind === "establishment" ? data.id : business?.id,
        ),
      );
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }
  const professionalField = (
    <label className="form-field">
      Profissional <span className="required-mark">*</span>
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
      <div className="form-page-grid w-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <form
          className="internal-form"
          noValidate
          onSubmit={handleSubmit(submit)}
          aria-busy={busy}
        >
          {kind === "establishment" ? (
            <>
              <FormSection
                number="01"
                title="A identidade do seu negócio"
                description="É assim que seus clientes vão encontrar você no Flow."
              >
                <label className="form-field">
                  Nome do estabelecimento{" "}
                  <span className="required-mark">*</span>
                  <input
                    {...register("name")}
                    required
                    maxLength={150}
                    placeholder="Ex.: Studio Aurora"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slugEdited)
                        setSlug(
                          e.target.value
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-|-$/g, ""),
                        );
                    }}
                    autoComplete="organization"
                  />
                  <FieldError name="name" />
                </label>
                <label className="form-field">
                  Endereço da sua página{" "}
                  <span className="required-mark">*</span>
                  <div className="slug-field flex min-h-12 items-center gap-2 overflow-hidden rounded-xl border border-zinc-200 px-3 py-0 focus-within:border-[#635BFF]">
                    <span className="shrink-0 bg-transparent p-0 text-xs text-zinc-400">
                      flow.magui.studio/
                    </span>
                    <input
                      {...register("slug")}
                      className="m-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 py-3 shadow-none outline-none focus:shadow-none"
                      required
                      minLength={3}
                      maxLength={70}
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      placeholder="seu-negocio"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugEdited(true);
                      }}
                    />
                  </div>
                  <small className="field-help">
                    Use letras minúsculas, números e hífens.
                  </small>
                  <FieldError name="slug" />
                </label>
                <fieldset className="category-field m-0 min-w-0 border-0 p-0 text-xs text-zinc-600 [&_legend]:mb-3">
                  <legend>
                    Categoria <span className="required-mark">*</span>
                  </legend>
                  <div className="category-cards grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {[
                      { name: "Beleza", icon: Sparkles },
                      { name: "Barbearia", icon: Scissors },
                      { name: "Saúde", icon: Stethoscope },
                      { name: "Bem-estar", icon: Heart },
                      { name: "Educação", icon: GraduationCap },
                      { name: "Consultoria", icon: BriefcaseBusiness },
                      { name: "Outros", icon: Globe },
                    ].map((c) => (
                      <label
                        key={c.name}
                        className="category-card relative isolate flex min-h-24 cursor-pointer items-end overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-[#635BFF]/50 has-checked:border-[#635BFF] has-checked:bg-[#F5F4FF] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#635BFF]"
                      >
                        <input
                          className="peer sr-only"
                          type="radio"
                          {...register("category")}
                          value={c.name}
                        />
                        <c.icon
                          aria-hidden="true"
                          className="pointer-events-none absolute -top-2 -right-3 -z-10 size-20 rotate-[-12deg] stroke-[1.2] text-[#635BFF]/10"
                        />
                        <strong className="text-xs font-medium text-zinc-700">
                          {c.name}
                        </strong>
                        <i className="absolute top-3 right-3 grid size-4 place-items-center rounded-full border border-zinc-200 text-transparent peer-checked:border-[#635BFF] peer-checked:bg-[#635BFF] peer-checked:text-white">
                          <Check size={12} />
                        </i>
                      </label>
                    ))}
                  </div>
                  <FieldError name="category" />
                </fieldset>
                <label className="form-field">
                  Sobre o seu espaço
                  <textarea
                    {...register("description")}
                    maxLength={1000}
                    rows={4}
                    placeholder="Conte o que torna o seu atendimento especial."
                  />
                  <small className="field-help">
                    Uma apresentação breve ajuda os clientes a conhecerem seu
                    negócio.
                  </small>
                  <FieldError name="description" />
                </label>
              </FormSection>
              <FormSection
                number="02"
                title="Onde e como encontrar você"
                description="Informe os contatos e a localização do seu atendimento."
              >
                <div className="fields-grid">
                  <label className="form-field">
                    Cidade / UF
                    <input
                      {...register("city")}
                      placeholder="São Paulo, SP"
                      autoComplete="address-level2"
                    />
                    <FieldError name="city" />
                  </label>
                  <label className="form-field">
                    WhatsApp de contato
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
                <label className="form-field">
                  Endereço completo
                  <input
                    {...register("address")}
                    maxLength={300}
                    placeholder="Rua, número, bairro e complemento"
                    autoComplete="street-address"
                  />
                  <small className="field-help">
                    Se você atende apenas online, pode deixar em branco.
                  </small>
                  <FieldError name="address" />
                </label>
              </FormSection>
              <FormSection
                number="03"
                title="Seu jeito de organizar a agenda"
                description="Defina como as reservas chegam até você."
              >
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
                <label className="form-field compact-field">
                  Prazo para cancelar (horas)
                  <input
                    {...register("cancelNoticeHours")}
                    type="number"
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
            <FormSection
              number="01"
              title="Quem faz parte da sua equipe?"
              description="O nome aparece para o cliente ao escolher quem vai atender."
            >
              <div className="professional-form-intro">
                <span>
                  {name ? (
                    name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                  ) : (
                    <Users size={26} />
                  )}
                </span>
                <div>
                  <strong>Um atendimento com nome e cuidado.</strong>
                  <p>
                    Cadastre um profissional por vez. Cada estabelecimento pode
                    ter até dez.
                  </p>
                </div>
              </div>
              <label className="form-field">
                Nome do profissional <span className="required-mark">*</span>
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
                  Depois, vincule os serviços e abra os horários desse
                  profissional.
                </small>
                <FieldError name="name" />
              </label>
            </FormSection>
          ) : kind === "service" ? (
            <>
              <FormSection
                number="01"
                title="O que você oferece?"
                description="Um nome claro ajuda o cliente a escolher o atendimento certo."
              >
                <label className="form-field">
                  Nome do serviço <span className="required-mark">*</span>
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
                    Duração (minutos) <span className="required-mark">*</span>
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
                <div className="free-service-field">
                  <label className="checkbox-field">
                    <input
                      {...register("free")}
                      type="checkbox"
                      checked={free}
                      onChange={(e) => setFree(e.target.checked)}
                    />
                    Este serviço é gratuito
                  </label>
                  <label className="form-field compact-field">
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
                  Data <span className="required-mark">*</span>
                  <FlowDate name="date" required />
                  <FieldError name="date" />
                </label>
                <div className="fields-grid">
                  <label className="form-field">
                    A partir de <span className="required-mark">*</span>
                    <FlowTime name="start" required />
                    <FieldError name="start" />
                  </label>
                  <label className="form-field">
                    Até <span className="required-mark">*</span>
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
                  Serviço coletivo <span className="required-mark">*</span>
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
                    Data <span className="required-mark">*</span>
                    <FlowDate name="date" required />
                    <FieldError name="date" />
                  </label>
                  <label className="form-field">
                    Começa às <span className="required-mark">*</span>
                    <FlowTime name="start" required />
                    <FieldError name="start" />
                  </label>
                </div>
                <label className="form-field compact-field">
                  Capacidade da turma <span className="required-mark">*</span>
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
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="internal-form-footer">
            <Link href={back} className="form-cancel">
              Cancelar
            </Link>
            <button className="button" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle size={16} className="spinning" />
                  Salvando…
                </>
              ) : (
                <>
                  {kind === "establishment"
                    ? "Criar estabelecimento"
                    : kind === "professional"
                      ? "Adicionar profissional"
                      : kind === "service"
                        ? "Cadastrar serviço"
                        : kind === "availability"
                          ? "Salvar período"
                          : "Criar sessão"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
        <aside className="form-companion hidden lg:block">
          <div className="form-companion-card">
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
                <i>{name[0] ?? "F"}</i>
                <strong>{name || "Nome do seu negócio"}</strong>
                <span>flow.magui.studio/{slug || "seu-negocio"}</span>
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
              href={panelHref("/painel/disponibilidade/novo", business?.id)}
            >
              Abrir horários antes de criar a sessão
              <ArrowRight size={13} />
            </Link>
          )}
        </aside>
      </div>
    </FormProvider>
  );
}
