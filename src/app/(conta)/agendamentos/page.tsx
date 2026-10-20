import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Meus agendamentos",
  "Consulte seus próximos horários, acompanhe confirmações e avalie os atendimentos concluídos.",
  "/agendamentos",
  true,
);
import { AnimatedArrow } from "@/components/ui/animated-arrow";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
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
import { completeOverdueBookings } from "@/lib/booking-completion";
import { BusinessMonogram } from "@/components/ui/business-monogram";
import { LocationMap } from "@/components/ui/location-map";
import { locationSchema } from "@/lib/address";
export default async function Page({
  searchParams,
}: {
  searchParams: SearchInput;
}) {
  const { userId } = await auth.protect();
  const query = await loadConsumerSearch(searchParams);
  const now = new Date();
  await completeOverdueBookings(prisma(), now, { consumerId: userId });
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
  const canReview = (booking: (typeof all)[number]) =>
    !booking.review &&
    booking.session.establishment.ownerId !== userId &&
    reviewEligible(booking.effectiveStatus, booking.session.startsAt, now);
  const rows = all.filter(
    (b) =>
      (query.avaliacoes !== "pending" || canReview(b)) &&
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
  const awaitingReview = all.filter(canReview).length;
  return (
    <>
      <PageHeading
        eyebrow="SEU TEMPO, ORGANIZADO"
        title="Seus próximos momentos."
        description="Acompanhe suas reservas, encontre os detalhes e cuide da sua agenda."
        action={
          <Link href="/explorar" className="button">
            Agendar um serviço
            <AnimatedArrow size={16} />
          </Link>
        }
      />
      <div className="consumer-summary">
        <div className="relative isolate overflow-hidden min-h-28">
          <CalendarDays
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 -bottom-4 -z-10 size-28 rotate-[-12deg] text-[#635BFF] opacity-[0.07]"
          />
          <strong>{upcoming.length}</strong>
          <span>agendamentos por vir</span>
        </div>
        <div className="relative isolate overflow-hidden min-h-28">
          <CheckCircle2
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 -bottom-4 -z-10 size-28 rotate-[-12deg] text-[#635BFF] opacity-[0.07]"
          />
          <strong>
            {upcoming.filter((b) => b.effectiveStatus === "confirmed").length}
          </strong>
          <span>confirmados</span>
        </div>
        <div className="relative isolate overflow-hidden min-h-28">
          <Clock
            aria-hidden="true"
            className="pointer-events-none absolute -right-3 -bottom-4 -z-10 size-28 rotate-[-12deg] text-[#635BFF] opacity-[0.07]"
          />
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
            href={serializeConsumer("/agendamentos", {
              periodo: "past",
              avaliacoes: "pending",
            })}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#635BFF]"
          >
            Avaliar atendimentos
            <AnimatedArrow size={14} />
          </Link>
        </div>
      )}
      <ListFilters
        placeholder="Buscar serviço, espaço ou profissional"
        statuses
        period
      />
      {query.avaliacoes === "pending" && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8e5f6] bg-white p-4 text-xs text-zinc-500">
          <span>
            Mostrando apenas atendimentos concluídos que você ainda não avaliou.
          </span>
          <Link
            href={serializeConsumer("/agendamentos", {
              periodo: "past",
              avaliacoes: null,
            })}
            className="font-medium text-[#635BFF] hover:underline"
          >
            Ver todo o histórico
          </Link>
        </div>
      )}
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
          href="/explorar"
          label="Explorar serviços"
          icon={<CalendarDays size={26} />}
        />
      ) : (
        <div className="consumer-booking-list grid-cols-1 lg:grid-cols-2">
          {rows.map((b) => {
            const e = b.session.establishment;
            const details = e.addressDetails;
            const location = locationSchema.safeParse(
              details && typeof details === "object" && !Array.isArray(details)
                ? details.location
                : undefined,
            );
            const canCancel =
              ["pending", "confirmed"].includes(b.effectiveStatus) &&
              b.session.startsAt.getTime() - now.getTime() >=
                e.cancelNoticeHours * 3600000;
            return (
              <article
                key={b.id}
                className="consumer-booking flex h-full min-w-0 flex-col"
              >
                <div className="consumer-booking-header px-4 py-3">
                  <Link href={`/${e.slug}`}>
                    <span
                      className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl pr-1"
                      style={{ background: e.color }}
                    >
                      {e.coverUrl ? (
                        <img
                          src={e.coverUrl}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                        />
                      ) : e.logoUrl ? (
                        <img
                          src={e.logoUrl}
                          alt=""
                          className="size-9 object-contain"
                        />
                      ) : (
                        <BusinessMonogram name={e.name} compact />
                      )}
                    </span>
                    <span>{e.name}</span>
                    <AnimatedArrow size={14} />
                  </Link>
                  <StatusPill
                    status={b.effectiveStatus}
                    label={statusLabel[b.effectiveStatus]}
                  />
                </div>
                <div className="consumer-booking-body grid grid-cols-1 items-start gap-3 p-4 sm:grid-cols-[160px_minmax(0,1fr)] xl:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="w-full min-w-0">
                    {b.session.service.modality !== "online" &&
                    location.success ? (
                      <LocationMap point={location.data} compact />
                    ) : (
                      <div className="flex h-24 items-center justify-center gap-2 rounded-xl bg-[#F5F4FF] px-4 text-xs text-zinc-500">
                        {b.session.service.modality === "online" ? (
                          <>
                            <Globe size={18} />
                            Atendimento online
                          </>
                        ) : (
                          <>
                            <MapPin size={18} />
                            {e.city || "Atendimento presencial"}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="consumer-booking-main min-w-0">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[#18181B]">
                        <CalendarDays aria-hidden="true" size={16} />
                        <strong>
                          {b.session.startsAt.toLocaleDateString("pt-BR", {
                            timeZone: e.timezone,
                            day: "2-digit",
                          })}
                        </strong>
                        <span className="text-xs font-semibold uppercase">
                          {b.session.startsAt.toLocaleDateString("pt-BR", {
                            timeZone: e.timezone,
                            month: "short",
                          })}
                        </span>
                      </div>
                      <strong className="consumer-booking-price ml-0 shrink-0">
                        {money(b.priceCents)}
                      </strong>
                    </div>

                    <h2 className="m-0 leading-tight">
                      {b.session.service.name}
                    </h2>
                    <p className="mt-1">Com {b.session.professional.name}</p>
                    <div className="booking-detail-line mt-2 gap-x-3 gap-y-2">
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
                      <span className="basis-full items-start leading-relaxed">
                        {b.session.service.modality === "online" ? (
                          <Globe size={14} className="mt-0.5 shrink-0" />
                        ) : (
                          <MapPin size={14} className="mt-0.5 shrink-0" />
                        )}
                        <span className="block min-w-0 break-words">
                          {b.session.service.modality === "online"
                            ? "Atendimento online"
                            : [e.address, e.city].filter(Boolean).join(" · ") ||
                              "Endereço não informado"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="consumer-booking-footer mt-auto flex-wrap gap-2 px-4 py-3">
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
                {(b.review || canReview(b)) && (
                  <BookingReview
                    bookingId={b.id}
                    establishment={e.name}
                    professional={b.session.professional.name}
                    service={b.session.service.name}
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
