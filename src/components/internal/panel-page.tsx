import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
  ArrowRight,
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
import { OwnerAppointment } from "./owner-appointment";
import { BookingActions } from "./booking-actions";
type Section =
  | "overview"
  | "agenda"
  | "establishments"
  | "professionals"
  | "services"
  | "availability"
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
  availability: {
    title: "Tempo para cada cuidado.",
    description:
      "Abra sua agenda, organize pausas e respeite o ritmo da sua equipe.",
    path: "/painel/disponibilidade",
    newPath: "/painel/disponibilidade/novo",
    cta: "Adicionar período",
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
    section: "availability",
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
        where: { establishmentId: b.id, active: true },
        include: {
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
      return (
        <>
          <PageHeading
            title="Sua equipe chegou ao limite do plano."
            description={`Seu plano permite até ${features.professionals} profissionais por estabelecimento.`}
          />
          <EmptyState
            title="Mais espaço para sua equipe"
            description="Confira os planos para ampliar a capacidade do seu negócio."
            href="/#planos"
            label="Ver planos"
          />
        </>
      );
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
      <>
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
      </>
    );
  }
  const createAction = meta.newPath ? (
    <Link className="button" href={link(meta.newPath)}>
      <Plus size={16} />
      {meta.cta}
    </Link>
  ) : undefined;
  if (section === "establishments") {
    const rows = await prisma().establishment.findMany({
      where: { ownerId: context.userId, active: true },
      include: { _count: { select: { professionals: true, services: true } } },
      orderBy: { name: "asc" },
    });
    return (
      <>
        <PageHeading
          eyebrow="UM LUGAR PARA CADA NEGÓCIO"
          title={meta.title}
          description={meta.description}
          action={
            rows.length < limit ? (
              createAction
            ) : (
              <Link href="/#planos" className="button secondary">
                Ver planos
                <ArrowUpRight size={15} />
              </Link>
            )
          }
        />
        <div className="section-subline">
          <span>
            {rows.length} de {limit} estabelecimentos no seu plano
          </span>
          <span>
            Plano {subscription.plan === "multi" ? "Pro" : "Essencial"}
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
          <div className="establishment-grid">
            {rows.map((e) => (
              <article className="establishment-card" key={e.id}>
                <div
                  className="establishment-card-cover"
                  style={{ background: e.color }}
                >
                  <span>
                    {e.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toLowerCase()}
                    <i>✳</i>
                  </span>
                  <span className="live-pill">
                    <i />
                    Página ativa
                  </span>
                </div>
                <div className="establishment-card-body">
                  <small>{e.category}</small>
                  <h2>{e.name}</h2>
                  <p>
                    <MapPin size={13} />
                    {e.city ?? "Atendimento online"}
                  </p>
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
                    <Link href={panelHref("/painel", e.id)}>
                      Gerenciar
                      <ArrowRight size={15} />
                    </Link>
                    <Link
                      href={`/${e.slug}`}
                      target="_blank"
                      aria-label={`Ver página de ${e.name}`}
                    >
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </>
    );
  }
  if (section === "subscription")
    return (
      <>
        <PageHeading
          eyebrow="FLOW PARA SEU NEGÓCIO"
          title={meta.title}
          description={meta.description}
        />
        <div className="subscription-grid">
          <section className="subscription-card">
            <span className="subscription-flower">✳</span>
            <StatusPill status="confirmed" label="Assinatura ativa" />
            <small>SEU PLANO ATUAL</small>
            <h2>{subscription.plan === "multi" ? "Pro" : "Essencial"}</h2>
            <p>Mais organização para cada próximo momento.</p>
            <div className="subscription-period">
              <span>Período atual</span>
              <strong>
                {subscription.currentPeriodStart.toLocaleDateString("pt-BR")} –{" "}
                {subscription.paidUntil.toLocaleDateString("pt-BR")}
              </strong>
            </div>
            <Link href="/#planos" className="button">
              Conhecer os planos
              <ArrowUpRight size={15} />
            </Link>
          </section>
          <SectionCard
            title="Seu espaço no Flow"
            description="Recursos que acompanham o seu negócio."
          >
            <div className="usage-stat">
              <span>Estabelecimentos</span>
              <strong>
                {businesses.length} / {limit}
              </strong>
            </div>
            <div className="usage-track">
              <i style={{ width: `${(businesses.length / limit) * 100}%` }} />
            </div>
            <ul className="subscription-benefits">
              {[
                `Até ${limit} ${limit === 1 ? "estabelecimento" : "estabelecimentos"}`,
                `${features.professionals} profissionais por estabelecimento`,
                "Serviços individuais e em grupo",
                "Página de agendamentos personalizada",
                "Aprovação automática ou manual",
                ...(features.reports
                  ? [
                      "Relatórios avançados e exportação CSV",
                      "4 templates, incluindo Editorial e Noturno",
                    ]
                  : ["2 templates: Flow e Essência"]),
              ].map((feature) => (
                <li key={feature}>
                  <Check size={15} />
                  {feature}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </>
    );
  if (!b)
    return (
      <>
        <PageHeading
          eyebrow="BEM-VINDO AO FLOW"
          title={
            section === "overview" ? "Seu negócio começa aqui." : meta.title
          }
          description="Transforme seu talento em uma agenda organizada. Vamos começar pelo seu espaço."
        />
        <div className="onboarding-hero">
          <div>
            <span className="internal-eyebrow">O PRIMEIRO PASSO É SIMPLES</span>
            <h2>
              Um espaço seu.
              <br />
              Mais tempo para crescer.
            </h2>
            <p>
              Crie sua página, apresente sua equipe e deixe os agendamentos
              fluírem.
            </p>
            <Link href="/painel/estabelecimentos/novo" className="button">
              <Plus size={16} />
              Criar meu estabelecimento
            </Link>
          </div>
          <span className="onboarding-flower">✳</span>
        </div>
        <div className="setup-explainer">
          {[
            [
              "01",
              "Seu estabelecimento",
              "Nome, contato e o seu jeito de atender.",
            ],
            ["02", "Equipe e serviços", "Quem atende e o que você oferece."],
            [
              "03",
              "Sua agenda aberta",
              "Datas e horários para receber clientes.",
            ],
          ].map(([n, title, description]) => (
            <div key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </>
    );
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
            <Link
              className="button"
              href={link("/painel/disponibilidade/novo")}
            >
              <Plus size={16} />
              Abrir horários
            </Link>
          }
        />
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
        <div className="overview-columns">
          <SectionCard
            title="Próximos encontros"
            description="Os momentos que estão chegando."
            aside={
              <Link className="subtle-link" href={link("/painel/agenda")}>
                Ver agenda
                <ArrowRight size={14} />
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
              <EmptyState
                title="O próximo encontro vem aí."
                description="Abra seus horários e compartilhe sua página para começar a receber agendamentos."
                href={link("/painel/disponibilidade/novo")}
                label="Abrir minha agenda"
                icon={<CalendarDays size={24} />}
              />
            )}
          </SectionCard>
          <div>
            <section className="share-page-card">
              <span>SEU NEGÓCIO, MAIS PERTO</span>
              <h2>
                Seu próximo cliente
                <br />
                começa por aqui.
              </h2>
              <p>Sua página está pronta para receber visitas.</p>
              <div>flow.magui.studio/{b.slug}</div>
              <Link href={`/${b.slug}`} target="_blank">
                Abrir minha página
                <ArrowUpRight size={17} />
              </Link>
            </section>
            <SectionCard title="Tudo pronto para fluir?">
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
                  done: windows > 0,
                  title: "Abra os primeiros horários",
                  href: "/painel/disponibilidade/novo",
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
          </div>
        </div>
      </>
    );
  }
  const matches = (text: string) =>
    text
      .toLocaleLowerCase("pt-BR")
      .includes(query.busca.toLocaleLowerCase("pt-BR"));
  if (section === "professionals") {
    const rows = professionals.filter((p) => matches(p.name));
    return (
      <>
        <PageHeading
          eyebrow={b.name}
          title={meta.title}
          description={meta.description}
          action={
            professionals.length < features.professionals
              ? createAction
              : undefined
          }
        />
        <ListFilters placeholder="Buscar profissional pelo nome" />
        <div className="section-subline">
          <span>
            {professionals.length} de {features.professionals} profissionais
          </span>
          <span>Estabelecimento: {b.name}</span>
        </div>
        {!rows.length ? (
          <EmptyState
            title={
              query.busca
                ? "Nenhum profissional encontrado."
                : "Quem vai cuidar dos seus clientes?"
            }
            description={
              query.busca
                ? "Experimente buscar por outro nome."
                : "Adicione sua equipe para vincular serviços e abrir a agenda."
            }
            href={query.busca ? undefined : link("/painel/profissionais/novo")}
            label="Adicionar profissional"
            icon={<Users size={26} />}
          />
        ) : (
          <div className="professional-grid">
            {rows.map((p) => (
              <article className="professional-card" key={p.id}>
                <div className="professional-card-top">
                  <span className="professional-avatar">
                    {p.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </span>
                  <StatusPill status="confirmed" label="Ativo" />
                </div>
                <h2>{p.name}</h2>
                <p>
                  {p.services.length}{" "}
                  {p.services.length === 1
                    ? "serviço vinculado"
                    : "serviços vinculados"}
                </p>
                <div className="service-chips">
                  {p.services.slice(0, 3).map((link) => (
                    <span key={link.serviceId}>{link.service.name}</span>
                  ))}
                  {!p.services.length && (
                    <span>Pronto para receber serviços</span>
                  )}
                </div>
                <Link
                  href={panelHref("/painel/disponibilidade/novo", b.id)}
                  className="professional-card-footer"
                >
                  Organizar horários
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </>
    );
  }
  if (section === "services") {
    const rows = services.filter((s) => matches(s.name));
    return (
      <>
        <PageHeading
          eyebrow={b.name}
          title={meta.title}
          description={meta.description}
          action={createAction}
        />
        <ListFilters placeholder="Buscar serviço" />
        <div className="section-subline">
          <span>{rows.length} serviços</span>
          <span>Valores combinados diretamente com o cliente</span>
        </div>
        {!rows.length ? (
          <EmptyState
            title={
              query.busca
                ? "Nenhum serviço encontrado."
                : "O que seu negócio faz de melhor?"
            }
            description={
              query.busca
                ? "Tente outro nome para encontrar seu serviço."
                : "Cadastre seus atendimentos com duração, valor e profissionais."
            }
            href={query.busca ? undefined : link("/painel/servicos/novo")}
            label="Cadastrar serviço"
            icon={<Scissors size={25} />}
          />
        ) : (
          <div className="service-list">
            {rows.map((s) => (
              <article className="service-list-card" key={s.id}>
                <span className="service-list-icon">
                  {s.kind === "collective" ? (
                    <Layers size={21} />
                  ) : (
                    <Scissors size={21} />
                  )}
                </span>
                <div className="service-list-main">
                  <h2>{s.name}</h2>
                  <div>
                    <span>
                      <Clock size={12} />
                      {s.durationMinutes} min
                    </span>
                    <span>
                      {s.kind === "collective" ? "Em grupo" : "Individual"}
                    </span>
                    <span>
                      {s.modality === "online" ? (
                        <Globe size={12} />
                      ) : (
                        <MapPin size={12} />
                      )}{" "}
                      {s.modality === "online" ? "Online" : "Presencial"}
                    </span>
                  </div>
                  <p>
                    {s.professionals
                      .map((p) => p.professional.name)
                      .join(" · ")}
                  </p>
                </div>
                <div className="service-list-price">
                  <strong>{money(s.priceCents)}</strong>
                  <small>por atendimento</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </>
    );
  }
  if (section === "availability") {
    const windows = await prisma().availabilityWindow.findMany({
      where: {
        professional: {
          establishmentId: b.id,
          ...(query.profissional !== "all" ? { id: query.profissional } : {}),
        },
        endsAt: { gt: new Date() },
      },
      include: { professional: true },
      orderBy: { startsAt: "asc" },
    });
    const blocks = await prisma().professionalBlock.findMany({
      where: {
        professional: {
          establishmentId: b.id,
          ...(query.profissional !== "all" ? { id: query.profissional } : {}),
        },
        endsAt: { gt: new Date() },
      },
      include: { professional: true },
      orderBy: { startsAt: "asc" },
    });
    const rows = [
      ...windows.map((w) => ({ ...w, type: "open" })),
      ...blocks.map((w) => ({ ...w, type: "block" })),
    ]
      .filter((w) => matches(w.professional.name))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    return (
      <>
        <PageHeading
          eyebrow={b.name}
          title={meta.title}
          description={meta.description}
          action={createAction}
        />
        <div className="availability-note">
          <Clock size={18} />
          <p>
            Os horários seguem <strong>{b.timezone}</strong>. Pausas e bloqueios
            têm prioridade sobre períodos abertos.
          </p>
        </div>
        <ListFilters
          placeholder="Buscar profissional"
          professionals={professionals}
        />
        {!rows.length ? (
          <EmptyState
            title="Uma agenda aberta para novos momentos."
            description="Escolha um profissional e abra o primeiro período de atendimento."
            href={link("/painel/disponibilidade/novo")}
            label="Adicionar período"
            icon={<Clock size={26} />}
          />
        ) : (
          <SectionCard
            title="Próximos períodos"
            description={`${rows.length} períodos na sua agenda`}
          >
            <div className="internal-table-scroll">
              <table className="internal-table">
                <thead>
                  <tr>
                    <th>Profissional</th>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Disponibilidade</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <span className="table-person">
                          <i>{w.professional.name[0]}</i>
                          {w.professional.name}
                        </span>
                      </td>
                      <td>
                        {w.startsAt.toLocaleDateString("pt-BR", {
                          timeZone: b.timezone,
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        {hourLabel(w.startsAt, b.timezone)} —{" "}
                        {hourLabel(w.endsAt, b.timezone)}
                      </td>
                      <td>
                        <StatusPill
                          status={w.type === "open" ? "confirmed" : "canceled"}
                          label={
                            w.type === "open"
                              ? "Aberto para reservas"
                              : "Bloqueado"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
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
          <div className="session-grid">
            {filtered.map((s) => (
              <article className="session-card" key={s.id}>
                <div className="session-card-heading">
                  <span>
                    <Layers size={19} />
                  </span>
                  <StatusPill
                    status={
                      s.bookings.length >= s.capacity ? "canceled" : "confirmed"
                    }
                    label={
                      s.bookings.length >= s.capacity
                        ? "Turma completa"
                        : `${s.capacity - s.bookings.length} vagas livres`
                    }
                  />
                </div>
                <h2>{s.service.name}</h2>
                <p>Com {s.professional.name}</p>
                <div className="session-card-date">
                  <CalendarDays size={16} />
                  {s.startsAt.toLocaleDateString("pt-BR", {
                    timeZone: b.timezone,
                    day: "2-digit",
                    month: "long",
                  })}
                  <span>{hourLabel(s.startsAt, b.timezone)}</span>
                </div>
                <div className="session-capacity">
                  <span>
                    {s.bookings.length} de {s.capacity} vagas ocupadas
                  </span>
                  <strong>{money(s.service.priceCents)}</strong>
                </div>
                <div className="usage-track">
                  <i
                    style={{
                      width: `${(s.bookings.length / s.capacity) * 100}%`,
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </>
    );
  }
  const now = new Date();
  const rows = await prisma().booking.findMany({
    where: {
      session: {
        establishmentId: b.id,
        ...(query.profissional !== "all"
          ? { professionalId: query.profissional }
          : {}),
        ...(query.periodo === "upcoming"
          ? { startsAt: { gte: now } }
          : query.periodo === "past"
            ? { startsAt: { lt: now } }
            : {}),
      },
    },
    include: { session: { include: { service: true, professional: true } } },
    orderBy: {
      session: { startsAt: query.periodo === "past" ? "desc" : "asc" },
    },
  });
  const bookings = rows
    .map((a) => ({
      ...a,
      effectiveStatus:
        a.status === "pending" && a.expiresAt && a.expiresAt <= now
          ? "expired"
          : a.status,
    }))
    .filter(
      (a) =>
        (query.status === "all" || a.effectiveStatus === query.status) &&
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
            href={link("/painel/disponibilidade/novo")}
          >
            <Plus size={16} />
            Abrir horários
          </Link>
        }
      />
      <ListFilters
        placeholder="Buscar serviço ou profissional"
        statuses
        period
        professionals={professionals}
      />
      <div className="section-subline">
        <span>
          {bookings.length}{" "}
          {bookings.length === 1 ? "agendamento" : "agendamentos"}
        </span>
        <span>Fuso: {b.timezone}</span>
      </div>
      {!bookings.length ? (
        <EmptyState
          title="Um pouco de espaço na sua agenda."
          description="Nenhum agendamento corresponde aos filtros. Seus próximos atendimentos aparecerão aqui."
          icon={<CalendarDays size={26} />}
        />
      ) : (
        <div className="owner-appointments">
          {bookings.map((a) => (
            <OwnerAppointment
              key={a.id}
              startsAt={a.session.startsAt}
              timezone={b.timezone}
              service={a.session.service.name}
              professional={a.session.professional.name}
              durationMinutes={a.durationMinutes}
              priceCents={a.priceCents}
              status={a.effectiveStatus}
              whatsapp={a.whatsapp}
              actions={
                <BookingActions
                  id={a.id}
                  status={a.effectiveStatus}
                  canComplete={a.session.startsAt <= now}
                />
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
