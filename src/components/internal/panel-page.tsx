import { ProUpgradeCard } from "./pro-upgrade-card";
import { SubscriptionOverview } from "./subscription-overview";
import { redirect } from "next/navigation";
import { ServicesTable } from "./services-table";
import { PlanLimitButton } from "./plan-limit-button";
import { ProfessionalsTable } from "./professionals-table";
import { professionalList } from "@/lib/professional-list";
import { matchesLinks, matchesListSearch } from "@/lib/list-filters";
import { EntityListFilters } from "./entity-list-filters";
import { BusinessOnboarding } from "./business-onboarding";
import { appAddress, businessPageUrl } from "@/lib/app-url";
import { locationSchema } from "@/lib/address";
import { LocationMap } from "@/components/ui/location-map";
import { AnimatedArrow } from "@/components/ui/animated-arrow";
import Link from "next/link";
import {
  Plus,
  CalendarDays,
  Users,
  Scissors,
  Clock,
  Building2,
  Check,
  Layers,
  CheckCircle2,
  MapPin,
  Globe,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { planFeatures } from "@/lib/plan-features";
import { panelContext } from "@/lib/panel-context";
import { panelHref, type SearchInput } from "@/lib/url-state";
import { prisma } from "@/lib/prisma";
import { money, statusLabel, hourLabel, dayKey } from "@/lib/format";
import { PageHeading, EmptyState, SectionCard, StatusPill } from "./primitives";
import { ListFilters } from "./filters";
import { BusinessForm, type FormKind } from "./business-form";
import { SessionsTable } from "./schedule-tables";
import { AgendaViews } from "./agenda-views";
import { BookingActions } from "./booking-actions";
type Section =
  | "overview"
  | "agenda"
  | "establishments"
  | "professionals"
  | "services"
  | "sessions"
  | "subscription";
const metadata: Record<
  Section,
  {
    title: string;
    description: string;
    path: string;
    newPath?: string;
    cta?: string;
  }
> = {
  overview: {
    title: "Tudo flui por aqui.",
    description:
      "Um olhar sobre a sua agenda e os próximos passos do seu negócio.",
    path: "/painel",
  },
  agenda: {
    title: "Agenda",
    description:
      "Cada horário, cada cliente, cada próximo encontro. Tudo em um só lugar.",
    path: "/painel/agenda",
  },
  establishments: {
    title: "Seus estabelecimentos",
    description:
      "Espaços diferentes, o mesmo cuidado. Gerencie os negócios da sua conta.",
    path: "/painel/estabelecimentos",
    newPath: "/painel/estabelecimentos/novo",
    cta: "Novo estabelecimento",
  },
  professionals: {
    title: "Quem faz acontecer.",
    description:
      "Sua equipe, seus talentos e as pessoas por trás de cada atendimento.",
    path: "/painel/profissionais",
    newPath: "/painel/profissionais/novo",
    cta: "Adicionar profissional",
  },
  services: {
    title: "Seu talento, em serviços.",
    description:
      "Organize o que você oferece e facilite a escolha dos seus clientes.",
    path: "/painel/servicos",
    newPath: "/painel/servicos/novo",
    cta: "Novo serviço",
  },
  sessions: {
    title: "Encontros que conectam.",
    description:
      "Organize turmas, acompanhe vagas e crie espaço para mais pessoas.",
    path: "/painel/sessoes",
    newPath: "/painel/sessoes/nova",
    cta: "Nova sessão",
  },
  subscription: {
    title: "Seu plano, seu ritmo.",
    description:
      "Confira sua assinatura e o espaço que o Flow oferece ao seu negócio.",
    path: "/painel/assinatura",
  },
};
const formMetadata: Record<
  FormKind,
  { title: string; description: string; section: Section }
> = {
  establishment: {
    title: "Um novo espaço no Flow.",
    description:
      "Vamos apresentar seu negócio e preparar sua página de agendamentos.",
    section: "establishments",
  },
  professional: {
    title: "Mais talento na sua equipe.",
    description: "Cadastre quem vai cuidar dos seus clientes.",
    section: "professionals",
  },
  service: {
    title: "Crie seu próximo serviço.",
    description: "Conte o que você oferece. A gente ajuda a organizar o tempo.",
    section: "services",
  },
  availability: {
    title: "Dê espaço aos próximos momentos.",
    description: "Escolha quando sua equipe estará disponível para atender.",
    section: "professionals",
  },
  session: {
    title: "Prepare o próximo encontro.",
    description: "Defina os detalhes da sua turma e abra as vagas.",
    section: "sessions",
  },
};
export async function PanelPage({
  section,
  searchParams,
  form,
}: {
  section: Section;
  searchParams: SearchInput;
  form?: FormKind;
}) {
  const context = await panelContext(searchParams);
  const { business: b, businesses, subscription, query } = context;
  const meta = metadata[section];
  const features = planFeatures(subscription.plan);
  const limit = features.establishments;
  const link = (path: string) => panelHref(path, b?.id);
  const professionals = b
    ? await prisma().professional.findMany({
        where: {
          establishmentId: b.id,
          deletedAt: null,
          ...(section === "professionals" || (section === "services" && !form)
            ? {}
            : { active: true }),
        },
        include: {
          photo: { select: { url: true } },
          services: {
            where: { service: { active: true } },
            include: { service: true },
          },
        },
        orderBy: { name: "asc" },
      })
    : [];
  const services = b
    ? await prisma().service.findMany({
        where: { establishmentId: b.id, active: true },
        include: { professionals: { include: { professional: true } } },
        orderBy: { name: "asc" },
      })
    : [];
  if (form) {
    const fm = formMetadata[form];
    const parent = metadata[fm.section];
    if (
      form === "professional" &&
      professionals.length >= features.professionals
    )
      redirect(link("/painel/profissionais"));
    if (form === "establishment" && businesses.length >= limit)
      return (
        <>
          <PageHeading
            title="Você chegou ao limite do seu plano."
            description={`Seu plano permite ${limit} ${limit === 1 ? "estabelecimento" : "estabelecimentos"}.`}
            back={{ href: link(parent.path), label: parent.title }}
          />
          <EmptyState
            title="Mais espaço para seu negócio"
            description="Conheça os planos disponíveis ou gerencie seus estabelecimentos atuais."
            href="/#planos"
            label="Ver planos"
          />
        </>
      );
    if (form !== "establishment" && !b)
      return (
        <>
          <PageHeading title={fm.title} description={fm.description} />
          <EmptyState
            title="Comece pelo seu estabelecimento"
            description="Cadastre seu negócio antes de organizar a equipe e a agenda."
            href="/painel/estabelecimentos/novo"
            label="Criar estabelecimento"
          />
        </>
      );
    if (
      ["service", "availability", "session"].includes(form) &&
      !professionals.length
    )
      return (
        <>
          <PageHeading
            title={fm.title}
            description={fm.description}
            back={{ href: link(parent.path), label: "Voltar" }}
          />
          <EmptyState
            title="Quem vai realizar os atendimentos?"
            description="Adicione pelo menos um profissional antes de continuar."
            href={link("/painel/profissionais/novo")}
            label="Adicionar profissional"
          />
        </>
      );
    if (form === "session" && !services.some((s) => s.kind === "collective"))
      return (
        <>
          <PageHeading
            title={fm.title}
            description={fm.description}
            back={{ href: link(parent.path), label: "Voltar" }}
          />
          <EmptyState
            title="Cadastre um serviço em grupo"
            description="Uma sessão precisa estar vinculada a um serviço coletivo."
            href={link("/painel/servicos/novo")}
            label="Cadastrar serviço"
          />
        </>
      );
    return (
      <div
        className={
          form === "professional"
            ? "[&_.internal-page-heading]:mb-4 [&_.internal-page-heading_h1]:m-0 [&_.internal-page-heading_h1]:text-3xl [&_.internal-page-heading_h1]:leading-tight [&_.internal-page-heading_p]:mt-1.5 [&_.internal-eyebrow]:mb-1.5 [&_.internal-back]:mb-3"
            : undefined
        }
      >
        <PageHeading
          eyebrow={b?.name ?? "SEU NOVO NEGÓCIO"}
          title={fm.title}
          description={fm.description}
          back={{ href: link(parent.path), label: parent.title }}
        />
        <BusinessForm
          key={b?.id ?? "new"}
          kind={form}
          business={b}
          professionals={professionals}
          services={services.filter((s) => s.kind === "collective")}
        />
      </div>
    );
  }
  const createAction = meta.newPath ? (
    <Link className="button" href={link(meta.newPath)}>
      <Plus size={16} />
      {meta.cta}
    </Link>
  ) : undefined;
  if (!b && section !== "subscription")
    return (
      <BusinessOnboarding
        title={section === "overview" ? "Seu negócio começa aqui." : meta.title}
      />
    );
  if (section === "establishments") {
    const rows = await prisma().establishment.findMany({
      where: { ownerId: context.userId, active: true },
      include: {
        _count: {
          select: {
            professionals: { where: { deletedAt: null } },
            services: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return (
      <>
        <PageHeading
          eyebrow="SEUS ESTABELECIMENTOS"
          title={meta.title}
          description={meta.description}
          action={
            businesses.length < limit ? (
              createAction
            ) : (
              <PlanLimitButton
                label={meta.cta ?? "Novo estabelecimento"}
                message={`Seu plano permite até ${limit} ${limit === 1 ? "estabelecimento" : "estabelecimentos"}. Altere seu plano para cadastrar mais.`}
              />
            )
          }
        />
        <div className="section-subline">
          <span>
            {rows.length} de {limit} estabelecimentos no seu plano
          </span>
          <span>
            Plano {subscription.plan === "multi" ? "Flow PRO" : "Essencial"}
          </span>
        </div>
        {!rows.length ? (
          <EmptyState
            title="Seu negócio merece um espaço aqui."
            description="Crie seu primeiro estabelecimento para organizar serviços, profissionais e horários."
            href="/painel/estabelecimentos/novo"
            label="Criar meu estabelecimento"
            icon={<Building2 size={26} />}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((e) => {
              const details = e.addressDetails;
              const location = locationSchema.safeParse(
                details &&
                  typeof details === "object" &&
                  !Array.isArray(details)
                  ? details.location
                  : undefined,
              );
              return (
                <article
                  className="establishment-card rounded-2xl! border-zinc-200! bg-white!"
                  key={e.id}
                >
                  <div
                    className="establishment-card-cover relative overflow-hidden"
                    style={{ background: e.color }}
                  >
                    {e.coverUrl ? (
                      <img
                        src={e.coverUrl}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <span>
                        {e.name
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toLowerCase()}
                        <i>✳</i>
                      </span>
                    )}
                    <span className="live-pill z-10">
                      <i />
                      {e.published ? "Página publicada" : "Em preparação"}
                    </span>
                  </div>
                  <div className="establishment-card-body">
                    <small>{e.category}</small>
                    <h2>{e.name}</h2>
                    <p>
                      <MapPin size={13} />
                      {e.city ?? "Atendimento online"}
                    </p>
                    {location.success && (
                      <div className="mt-4 [&_[role=region]]:h-44">
                        <LocationMap point={location.data} />
                      </div>
                    )}
                    <div className="establishment-card-stats">
                      <span>
                        <Users size={14} />
                        {e._count.professionals} profissionais
                      </span>
                      <span>
                        <Scissors size={14} />
                        {e._count.services} serviços
                      </span>
                    </div>
                    <div className="establishment-card-footer">
                      <Link href={`/painel/estabelecimentos/${e.id}/editar`}>
                        Editar estabelecimento
                        <AnimatedArrow direction="right" size={15} />
                      </Link>
                      <Link
                        href={
                          e.published
                            ? `/${e.slug}`
                            : panelHref("/painel/configuracao", e.id)
                        }
                        target={e.published ? "_blank" : undefined}
                        aria-label={
                          e.published
                            ? `Ver página de ${e.name}`
                            : `Configurar ${e.name}`
                        }
                      >
                        <AnimatedArrow size={18} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </>
    );
  }
  if (section === "subscription") {
    const usage = await prisma().establishment.findMany({
      where: { ownerId: context.userId, active: true },
      select: {
        id: true,
        name: true,
        _count: { select: { professionals: { where: { deletedAt: null } } } },
      },
      orderBy: { name: "asc" },
    });
    return (
      <>
        <PageHeading
          eyebrow="SUA CONTA FLOW"
          title={meta.title}
          description="Consulte seu plano, acompanhe os limites e veja os recursos disponíveis para o seu negócio."
        />
        <SubscriptionOverview
          subscription={subscription}
          businesses={usage.map((e) => ({
            id: e.id,
            name: e.name,
            professionals: e._count.professionals,
          }))}
          timezone={b?.timezone ?? "America/Sao_Paulo"}
        />
      </>
    );
  }
  if (!b) return <BusinessOnboarding title={meta.title} />;
  if (section === "overview") {
    const now = new Date();
    const localDay = dayKey(now, b.timezone);
    const bounds = (
      await prisma().$queryRaw<
        { start: Date; end: Date }[]
      >`SELECT (${localDay}::date::timestamp AT TIME ZONE ${b.timezone}) AS start,((${localDay}::date+1)::timestamp AT TIME ZONE ${b.timezone}) AS end`
    )[0];
    const activeWhere = {
      session: { establishmentId: b.id },
      OR: [
        { status: "confirmed" },
        { status: "pending", expiresAt: { gt: now } },
      ],
    };
    const [today, pending, windows, bookings] = await Promise.all([
      prisma().booking.count({
        where: {
          ...activeWhere,
          session: {
            establishmentId: b.id,
            startsAt: { gte: bounds.start, lt: bounds.end },
          },
        },
      }),
      prisma().booking.count({
        where: {
          session: { establishmentId: b.id },
          status: "pending",
          expiresAt: { gt: now },
        },
      }),
      prisma().availabilityWindow.count({
        where: { professional: { establishmentId: b.id }, endsAt: { gt: now } },
      }),
      prisma().booking.findMany({
        where: {
          ...activeWhere,
          session: { establishmentId: b.id, startsAt: { gte: now } },
        },
        include: {
          session: { include: { service: true, professional: true } },
        },
        orderBy: { session: { startsAt: "asc" } },
        take: 5,
      }),
    ]);
    return (
      <>
        <PageHeading
          eyebrow={now.toLocaleDateString("pt-BR", {
            timeZone: b.timezone,
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          title={meta.title}
          description={`Um novo dia para cuidar de ${b.name}. Veja o que está acontecendo.`}
          action={
            <Link className="button" href={link("/painel/profissionais")}>
              <Plus size={16} />
              Abrir horários
            </Link>
          }
        />
        {!b.published && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e8e5f6] bg-[#F5F4FF] p-5">
            <div>
              <h2 className="text-sm font-semibold">
                Sua página está em preparação.
              </h2>
              <p className="mt-2 text-xs leading-6 text-zinc-500">
                Configure sua equipe, serviços e horários antes de receber
                reservas.
              </p>
            </div>
            <Link href={link("/painel/configuracao")} className="button small">
              Continuar configuração
            </Link>
          </div>
        )}
        <div className="overview-metrics">
          {[
            {
              label: "Agendamentos hoje",
              value: today,
              icon: CalendarDays,
              note: "No horário do seu estabelecimento",
            },
            {
              label: "Aguardando aprovação",
              value: pending,
              icon: Clock,
              note: pending
                ? "Seus clientes estão esperando"
                : "Tudo em dia por aqui",
            },
            {
              label: "Profissionais ativos",
              value: professionals.length,
              icon: Users,
              note: `Até ${features.professionals} no seu estabelecimento`,
            },
            {
              label: "Serviços disponíveis",
              value: services.length,
              icon: Scissors,
              note: "Seu talento em cada atendimento",
            },
          ].map((m) => (
            <div
              className="metric-card relative isolate overflow-hidden"
              key={m.label}
            >
              <div>
                <span>{m.label}</span>
                <i
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-3 -bottom-5 -z-10 rotate-[-12deg] bg-transparent p-0 opacity-10"
                >
                  <m.icon className="size-28 stroke-[1.2]" />
                </i>
              </div>
              <strong>{m.value.toString().padStart(2, "0")}</strong>
              <small>{m.note}</small>
            </div>
          ))}
        </div>
        <div className="overview-columns items-stretch">
          <SectionCard
            className="flex h-full flex-col"
            title="Próximos encontros"
            description="Os momentos que estão chegando."
            aside={
              <Link className="subtle-link" href={link("/painel/agenda")}>
                Ver agenda
                <AnimatedArrow direction="right" size={14} />
              </Link>
            }
          >
            {bookings.length ? (
              bookings.map((a) => (
                <div className="upcoming-row" key={a.id}>
                  <div className="upcoming-time">
                    <strong>{hourLabel(a.session.startsAt, b.timezone)}</strong>
                    <small>
                      {a.session.startsAt.toLocaleDateString("pt-BR", {
                        timeZone: b.timezone,
                        day: "2-digit",
                        month: "short",
                      })}
                    </small>
                  </div>
                  <div>
                    <strong>{a.session.service.name}</strong>
                    <small>{a.session.professional.name}</small>
                  </div>
                  <StatusPill status={a.status} label={statusLabel[a.status]} />
                </div>
              ))
            ) : (
              <div className="flex flex-1 p-5 sm:p-6 [&>.internal-empty]:flex-1">
                <EmptyState
                  title="O próximo encontro vem aí."
                  description="Abra seus horários e compartilhe sua página para começar a receber agendamentos."
                  href={link("/painel/profissionais")}
                  label="Abrir minha agenda"
                  icon={<CalendarDays size={24} />}
                />
              </div>
            )}
          </SectionCard>
          <div className="space-y-5">
            <SectionCard
              title="Tudo pronto para fluir?"
              description="Complete estas etapas para começar a receber agendamentos."
            >
              {[
                {
                  done: professionals.length > 0,
                  title: "Apresente sua equipe",
                  href: "/painel/profissionais/novo",
                },
                {
                  done: services.length > 0,
                  title: "Cadastre seus serviços",
                  href: "/painel/servicos/novo",
                },
                {
                  done:
                    windows > 0 ||
                    professionals.some((p) => {
                      const schedule = p.weeklySchedule as {
                        days?: { enabled?: boolean }[];
                      } | null;
                      return schedule?.days?.some((day) => day.enabled);
                    }),
                  title: "Configure os horários da equipe",
                  href: "/painel/profissionais",
                },
                {
                  done: b.published,
                  title: "Publique seu estabelecimento",
                  href: "/painel/configuracao",
                },
              ].map((step) => (
                <Link
                  className="setup-step"
                  key={step.title}
                  href={link(step.href)}
                >
                  <span className={step.done ? "done" : ""}>
                    {step.done ? <Check size={13} /> : <Plus size={13} />}
                  </span>
                  {step.title}
                  <ChevronRight size={14} />
                </Link>
              ))}
            </SectionCard>
            <section className="share-page-card mb-0">
              <span>SEU NEGÓCIO, MAIS PERTO</span>
              <h2>
                Seu próximo cliente
                <br />
                começa por aqui.
              </h2>
              <p>
                {b.published
                  ? "Sua página está pronta para receber visitas."
                  : "Conclua a configuração e publique para receber visitas."}
              </p>
              <div>
                {appAddress}/{b.slug}
              </div>
              <Link
                href={
                  b.published
                    ? businessPageUrl(b.slug)
                    : link("/painel/configuracao")
                }
                target={b.published ? "_blank" : undefined}
              >
                {b.published ? "Abrir minha página" : "Concluir configuração"}
                <AnimatedArrow size={17} />
              </Link>
            </section>
          </div>
        </div>
        {subscription.plan !== "multi" && (
          <ProUpgradeCard professionals={professionals.length} />
        )}
      </>
    );
  }
  const matches = (text: string) =>
    text
      .toLocaleLowerCase("pt-BR")
      .includes(query.busca.toLocaleLowerCase("pt-BR"));
  if (section === "professionals") {
    const rows = professionalList(
      professionals.filter(
        (p) =>
          matchesListSearch(p.name, query.busca) &&
          matchesLinks(
            p.services.map((link) => link.serviceId),
            query.servicos,
            query.combinarServicos,
          ),
      ),
      query.ordem,
      query.vinculos,
    );
    return (
      <>
        <PageHeading
          eyebrow={b.name}
          title={meta.title}
          description={meta.description}
          action={
            professionals.length < features.professionals ? (
              createAction
            ) : (
              <PlanLimitButton
                label="Adicionar profissional"
                message={`Seu plano permite até ${features.professionals} profissionais. Exclua um profissional ou altere seu plano para cadastrar outro.`}
              />
            )
          }
        />
        <EntityListFilters
          kind="professionals"
          options={services.map((service) => ({
            id: service.id,
            name: service.name,
          }))}
          count={rows.length}
          total={professionals.length}
        />
        {!rows.length ? (
          <EmptyState
            title={
              professionals.length > 0
                ? "Nenhum profissional encontrado."
                : "Quem vai cuidar dos seus clientes?"
            }
            description={
              professionals.length > 0
                ? "Experimente outro nome ou ajuste os filtros."
                : "Adicione sua equipe para vincular serviços e abrir a agenda."
            }
            href={
              professionals.length
                ? undefined
                : link("/painel/profissionais/novo")
            }
            label="Adicionar profissional"
            icon={<Users size={26} />}
          />
        ) : (
          <ProfessionalsTable
            rows={rows}
            establishmentId={b.id}
            timezone={b.timezone}
            now={new Date().toISOString()}
          />
        )}
      </>
    );
  }
  if (section === "services") {
    const rows = services
      .filter(
        (s) =>
          matchesListSearch(s.name, query.busca) &&
          matchesLinks(
            s.professionals
              .filter((link) => !link.professional.deletedAt)
              .map((link) => link.professionalId),
            query.profissionais,
            query.combinarProfissionais,
          ) &&
          (query.modalidade === "all" || s.modality === query.modalidade) &&
          (query.tipo === "all" || s.kind === query.tipo) &&
          (query.preco === "all" ||
            (query.preco === "free" ? s.priceCents === 0 : s.priceCents > 0)),
      )
      .sort((a, b) => {
        const direction = query.ordemServico.endsWith("desc") ? -1 : 1;
        const comparison = query.ordemServico.startsWith("price")
          ? a.priceCents - b.priceCents
          : query.ordemServico.startsWith("duration")
            ? a.durationMinutes - b.durationMinutes
            : a.name.localeCompare(b.name, "pt-BR");
        return (
          comparison * direction ||
          a.name.localeCompare(b.name, "pt-BR") ||
          a.id.localeCompare(b.id)
        );
      });
    return (
      <>
        <PageHeading
          eyebrow={b.name}
          title={meta.title}
          description={meta.description}
          action={createAction}
        />
        <EntityListFilters
          kind="services"
          options={professionals.map((professional) => ({
            id: professional.id,
            name: professional.name,
          }))}
          count={rows.length}
          total={services.length}
        />
        {!rows.length ? (
          <EmptyState
            title={
              services.length > 0 ||
              query.profissionais.length > 0 ||
              query.busca ||
              query.modalidade !== "all" ||
              query.tipo !== "all" ||
              query.preco !== "all"
                ? "Nenhum serviço encontrado."
                : "O que seu negócio faz de melhor?"
            }
            description={
              services.length > 0 ||
              query.profissionais.length > 0 ||
              query.busca ||
              query.modalidade !== "all" ||
              query.tipo !== "all" ||
              query.preco !== "all"
                ? "Ajuste a busca ou os filtros para encontrar seu serviço."
                : "Cadastre seus atendimentos com duração, valor e profissionais."
            }
            href={
              services.length || query.profissionais.length || query.busca
                ? undefined
                : link("/painel/servicos/novo")
            }
            label="Cadastrar serviço"
            icon={<Scissors size={25} />}
          />
        ) : (
          <ServicesTable rows={rows} establishmentId={b.id} />
        )}
      </>
    );
  }
  if (section === "sessions") {
    const now = new Date();
    const rows = await prisma().session.findMany({
      where: {
        establishmentId: b.id,
        service: { kind: "collective" },
        active: true,
        startsAt: { gt: now },
        ...(query.profissional !== "all"
          ? { professionalId: query.profissional }
          : {}),
      },
      include: {
        service: true,
        professional: true,
        bookings: {
          where: {
            OR: [
              { status: "confirmed" },
              { status: "pending", expiresAt: { gt: now } },
            ],
          },
          select: { id: true },
        },
      },
      orderBy: { startsAt: "asc" },
    });
    const filtered = rows.filter((s) =>
      matches(s.service.name + " " + s.professional.name),
    );
    return (
      <>
        <PageHeading
          eyebrow={b.name}
          title={meta.title}
          description={meta.description}
          action={createAction}
        />
        <ListFilters
          placeholder="Buscar sessão ou profissional"
          professionals={professionals}
        />
        {!filtered.length ? (
          <EmptyState
            title="Mais pessoas, um mesmo momento."
            description="Crie uma sessão para seus serviços coletivos e defina a capacidade de cada turma."
            href={link("/painel/sessoes/nova")}
            label="Criar sessão"
            icon={<Layers size={26} />}
          />
        ) : (
          <SessionsTable rows={filtered} timezone={b.timezone} />
        )}
      </>
    );
  }
  const now = new Date();
  const [boundary] = await prisma().$queryRaw<
    { start: Date }[]
  >`SELECT (${dayKey(now, b.timezone)}::date::timestamp AT TIME ZONE ${b.timezone}) AS start`;
  const rows = await prisma().booking.findMany({
    where: {
      status: { notIn: ["canceled", "declined"] },
      session: {
        establishmentId: b.id,
        ...(query.periodo === "upcoming"
          ? { startsAt: { gte: boundary.start } }
          : query.periodo === "past"
            ? { startsAt: { lt: boundary.start } }
            : {}),
        ...(query.profissional !== "all"
          ? { professionalId: query.profissional }
          : {}),
      },
    },
    include: { session: { include: { service: true, professional: true } } },
    orderBy: {
      session: { startsAt: "asc" },
    },
  });
  const bookings = rows
    .map((a) => ({
      ...a,
      effectiveStatus:
        a.status === "pending" && a.expiresAt && a.expiresAt <= now
          ? "expired"
          : a.status === "confirmed" && a.session.endsAt <= now
            ? "ended"
            : a.status,
    }))
    .filter((a) =>
      matches(a.session.service.name + " " + a.session.professional.name),
    );
  return (
    <>
      <PageHeading
        eyebrow={b.name}
        title={meta.title}
        description={meta.description}
        action={
          <Link
            className="button secondary"
            href={link("/painel/profissionais")}
          >
            <Plus size={16} />
            Abrir horários
          </Link>
        }
      />
      <ListFilters
        placeholder="Buscar serviço ou profissional"
        period
        professionals={professionals}
      />
      <AgendaViews
        timezone={b.timezone}
        rows={bookings.map((a) => ({
          ...a,
          actions: (
            <BookingActions
              id={a.id}
              status={a.effectiveStatus}
              canComplete={a.session.startsAt <= now}
              arrivedAt={a.arrivedAt}
              startsAt={a.session.startsAt}
            />
          ),
        }))}
      />
    </>
  );
}
