import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  MapPin,
  Globe,
  CheckCircle2,
  Star,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money, hourLabel, statusLabel } from "@/lib/format";
import {
  loadConsumerSearch,
  serializeConsumer,
  type SearchInput,
} from "@/lib/url-state";
import {
  PageHeading,
  EmptyState,
  StatusPill,
} from "@/components/internal/primitives";
import { ListFilters } from "@/components/internal/filters";
import { BookingActions } from "@/components/internal/booking-actions";
import { BookingReview } from "@/components/internal/booking-review";
import { reviewEligible } from "@/lib/review-rules";
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  const { userId } = await auth.protect();
  const query = await loadConsumerSearch(searchParams);
  const now = new Date();
  const records = await prisma().booking.findMany({
    where: { consumerId: userId },
    include: {
      review: true,
      session: {
        include: { establishment: true, service: true, professional: true },
      },
    },
    orderBy: { session: { startsAt: "asc" } },
  });
  const all = records.map((b) => ({
    ...b,
    effectiveStatus:
      b.status === "pending" && b.expiresAt && b.expiresAt <= now
        ? "expired"
        : b.status,
  }));
  const upcoming = all.filter(
    (b) =>
      b.session.startsAt >= now &&
      ["confirmed", "pending"].includes(b.effectiveStatus),
  );
  const rows = all.filter(
    (b) =>
      (query.periodo === "all" ||
        (query.periodo === "upcoming"
          ? b.session.startsAt >= now
          : b.session.startsAt < now)) &&
      (query.status === "all" || b.effectiveStatus === query.status) &&
      `${b.session.service.name} ${b.session.establishment.name} ${b.session.professional.name}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.busca.toLocaleLowerCase("pt-BR")),
  );
  if (query.periodo === "past") rows.reverse();
  const awaitingReview = all.filter(
    (b) =>
      !b.review && reviewEligible(b.effectiveStatus, b.session.startsAt, now),
  ).length;
  return (
    <>
      <PageHeading
        eyebrow="SEU TEMPO, ORGANIZADO"
        title="Seus próximos momentos."
        description="Acompanhe suas reservas, encontre os detalhes e cuide da sua agenda."
        action={
          <Link href="/#explorar" className="button">
            Agendar um serviço
            <ArrowUpRight size={16} />
          </Link>
        }
      />
      <div className="consumer-summary">
        <div>
          <span className="summary-icon">
            <CalendarDays size={20} />
          </span>
          <strong>{upcoming.length}</strong>
          <span>agendamentos por vir</span>
        </div>
        <div>
          <span className="summary-icon">
            <CheckCircle2 size={20} />
          </span>
          <strong>
            {upcoming.filter((b) => b.effectiveStatus === "confirmed").length}
          </strong>
          <span>confirmados</span>
        </div>
        <div>
          <span className="summary-icon">
            <Clock size={20} />
          </span>
          <strong>
            {upcoming.filter((b) => b.effectiveStatus === "pending").length}
          </strong>
          <span>aguardando aprovação</span>
        </div>
      </div>
      {awaitingReview > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e8e5f6] bg-[#F5F4FF] p-5">
          <span className="inline-flex items-center gap-3 text-sm text-zinc-700">
            <Star size={18} className="text-[#635BFF]" />
            Você tem {awaitingReview}{" "}
            {awaitingReview === 1
              ? "atendimento para avaliar"
              : "atendimentos para avaliar"}
            .
          </span>
          <Link
            href={serializeConsumer("/agendamentos", { periodo: "past" })}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#635BFF]"
          >
            Avaliar atendimentos
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
      <ListFilters
        placeholder="Buscar serviço, espaço ou profissional"
        statuses
        period
      />
      <div className="section-subline">
        <span>
          {rows.length} {rows.length === 1 ? "agendamento" : "agendamentos"}
        </span>
        <span>Reservas e histórico da sua conta</span>
      </div>
      {!rows.length ? (
        <EmptyState
          title={
            all.length
              ? "Nenhum agendamento por aqui."
              : "Qual será seu próximo momento?"
          }
          description={
            all.length
              ? "Tente outro período ou ajuste os filtros para encontrar sua reserva."
              : "Encontre um profissional, escolha seu serviço e reserve um tempo para você."
          }
          href="/#explorar"
          label="Explorar serviços"
          icon={<CalendarDays size={26} />}
        />
      ) : (
        <div className="consumer-booking-list">
          {rows.map((b) => {
            const e = b.session.establishment;
            const canCancel =
              ["pending", "confirmed"].includes(b.effectiveStatus) &&
              b.session.startsAt.getTime() - now.getTime() >=
                e.cancelNoticeHours * 3600000;
            return (
              <article key={b.id} className="consumer-booking">
                <div className="consumer-booking-header">
                  <Link href={`/${e.slug}`}>
                    <i style={{ background: e.color }}>{e.name[0]}</i>
                    <span>{e.name}</span>
                    <ArrowUpRight size={14} />
                  </Link>
                  <StatusPill
                    status={b.effectiveStatus}
                    label={statusLabel[b.effectiveStatus]}
                  />
                </div>
                <div className="consumer-booking-body">
                  <div className="appointment-date-block">
                    <strong>
                      {b.session.startsAt.toLocaleDateString("pt-BR", {
                        timeZone: e.timezone,
                        day: "2-digit",
                      })}
                    </strong>
                    <span>
                      {b.session.startsAt.toLocaleDateString("pt-BR", {
                        timeZone: e.timezone,
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="consumer-booking-main">
                    <h2>{b.session.service.name}</h2>
                    <p>Com {b.session.professional.name}</p>
                    <div className="booking-detail-line">
                      <span>
                        <CalendarDays size={14} />
                        {b.session.startsAt.toLocaleDateString("pt-BR", {
                          timeZone: e.timezone,
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span>
                        <Clock size={14} />
                        {hourLabel(b.session.startsAt, e.timezone)} ·{" "}
                        {b.durationMinutes} min
                      </span>
                      <span>
                        {b.session.service.modality === "online" ? (
                          <Globe size={14} />
                        ) : (
                          <MapPin size={14} />
                        )}{" "}
                        {b.session.service.modality === "online"
                          ? "Online"
                          : e.city || "Presencial"}
                      </span>
                    </div>
                  </div>
                  <strong className="consumer-booking-price">
                    {money(b.priceCents)}
                  </strong>
                </div>
                <div className="consumer-booking-footer">
                  <p>
                    {b.effectiveStatus === "pending" && b.expiresAt
                      ? `Aguardando resposta até ${b.expiresAt.toLocaleString("pt-BR", { timeZone: e.timezone, dateStyle: "short", timeStyle: "short" })}.`
                      : canCancel
                        ? `Cancelamento disponível até ${e.cancelNoticeHours}h antes do atendimento.`
                        : ["pending", "confirmed"].includes(b.effectiveStatus)
                          ? "Para alterações, entre em contato com o estabelecimento."
                          : "Este agendamento está no seu histórico."}
                  </p>
                  <BookingActions
                    id={b.id}
                    status={b.effectiveStatus}
                    consumer
                    canCancel={canCancel}
                  />
                </div>
                {(b.review ||
                  reviewEligible(
                    b.effectiveStatus,
                    b.session.startsAt,
                    now,
                  )) && (
                  <BookingReview
                    bookingId={b.id}
                    establishment={e.name}
                    professional={b.session.professional.name}
                    saved={b.review}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
