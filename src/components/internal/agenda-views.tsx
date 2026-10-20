"use client";
import { useEffect } from "react";
import { StatusBadge } from "@/components/ui/statusBadge";
import { FlowTabs } from "@/components/ui/flow-tabs";
import { useRouter } from "next/navigation";
import { formatContact } from "@/lib/format-contact";
import { useQueryState, parseAsStringEnum, parseAsString } from "nuqs";
import {
  Table2,
  CalendarDays,
  CalendarRange,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { AgendaTable, type BookingRow } from "./schedule-tables";
import { dayKey, hourLabel, money, statusLabel } from "@/lib/format";
const modes = [
  { value: "table", label: "Tabela", icon: Table2 },
  { value: "day", label: "Agenda diária", icon: CalendarDays },
  { value: "month", label: "Calendário", icon: CalendarRange },
  { value: "timeline", label: "Cronograma", icon: ListOrdered },
] as const;
function shiftDay(day: string, delta: number) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
function labelDay(day: string) {
  return new Date(day + "T12:00:00Z").toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function Appointment({
  booking: a,
  timezone,
}: {
  booking: BookingRow;
  timezone: string;
}) {
  return (
    <article
      className={`min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs ${!["confirmed", "pending"].includes(a.effectiveStatus) ? "opacity-50" : ""}`}
    >
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold tabular-nums text-zinc-600">
            <Clock size={13} aria-hidden="true" />
            {hourLabel(a.session.startsAt, timezone)} · {a.durationMinutes} min
          </span>
          <StatusBadge status={a.effectiveStatus} />
        </div>
        <h3 className="m-0 break-words text-sm font-semibold text-zinc-800">
          {a.session.service.name}
        </h3>
        <p className="m-0 text-xs text-zinc-500">
          {a.session.professional.name}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span>{formatContact(a.whatsapp)}</span>
          <strong className="font-semibold text-zinc-700">
            {a.priceCents ? money(a.priceCents) : "Gratuito"}
          </strong>
        </div>
      </div>
      {["confirmed", "pending"].includes(a.effectiveStatus) && (
        <div className="border-t border-zinc-100 px-4 py-3 [&_.appointment-actions]:flex-wrap [&_.appointment-actions]:justify-end">
          {a.actions}
        </div>
      )}
    </article>
  );
}
export function AgendaViews({
  rows: incomingRows,
  timezone,
  preview = false,
  previewView,
  previewDate,
}: {
  rows: BookingRow[];
  timezone: string;
  preview?: boolean;
  previewView?: "table" | "day" | "month" | "timeline";
  previewDate?: string;
}) {
  const router = useRouter();
  useEffect(() => {
    if (preview) return;
    const refresh = () => {
      if (
        document.visibilityState !== "visible" ||
        document.querySelector('[role="alertdialog"], [role="dialog"]')
      )
        return;
      router.refresh();
    };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, preview]);
  const rows = incomingRows
    .filter((a) => !["canceled", "declined"].includes(a.effectiveStatus))
    .sort((a, b) => {
      const aClosed = !["confirmed", "pending"].includes(a.effectiveStatus);
      const bClosed = !["confirmed", "pending"].includes(b.effectiveStatus);
      return (
        Number(aClosed) - Number(bClosed) ||
        new Date(a.session.startsAt).getTime() -
          new Date(b.session.startsAt).getTime()
      );
    });
  const [queryView, setView] = useQueryState(
    "visualizacao",
    parseAsStringEnum(["table", "day", "month", "timeline"])
      .withDefault("table")
      .withOptions({ shallow: true, scroll: false }),
  );
  const view = preview ? (previewView ?? "table") : queryView;
  const today =
    preview && previewDate ? previewDate : dayKey(new Date(), timezone);
  const [dateParam, setDate] = useQueryState(
    "data-agenda",
    parseAsString.withOptions({ shallow: true, scroll: false }),
  );
  const date =
    !preview &&
    dateParam &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateParam) &&
    !Number.isNaN(new Date(dateParam + "T12:00:00Z").getTime()) &&
    new Date(dateParam + "T12:00:00Z").toISOString().slice(0, 10) === dateParam
      ? dateParam
      : today;
  const grouped = new Map<string, BookingRow[]>();
  [...rows]
    .sort(
      (a, b) =>
        new Date(a.session.startsAt).getTime() -
        new Date(b.session.startsAt).getTime(),
    )
    .forEach((a) => {
      const day = dayKey(a.session.startsAt, timezone);
      grouped.set(day, [...(grouped.get(day) ?? []), a]);
    });
  const selected = grouped.get(date) ?? [];
  const empty = (
    <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
      Nenhum agendamento neste período com os filtros selecionados.
    </div>
  );
  const monthStart = date.slice(0, 7) + "-01";
  const monthEnd = new Date(
    Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0),
  ).getUTCDate();
  const offset = (new Date(monthStart + "T12:00:00Z").getUTCDay() + 6) % 7;
  function navigate(delta: number) {
    if (view !== "month") {
      void setDate(shiftDay(date, delta));
      return;
    }
    const d = new Date(monthStart + "T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + delta);
    void setDate(d.toISOString().slice(0, 10));
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FlowTabs
          items={modes}
          value={view}
          onValueChange={(value) => void setView(value)}
          label="Visualização da agenda"
          id="agenda-tab"
          panelId={() => "agenda-view-panel"}
        />
        <span className="text-xs text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-emerald-600"
            />
            {rows.length} agendamentos · Atualiza a cada 30 s
          </span>
        </span>
      </div>
      <div
        role="tabpanel"
        id="agenda-view-panel"
        aria-labelledby={`agenda-tab-${view}`}
        className="space-y-5"
      >
        {(view === "day" || view === "month") && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold capitalize text-zinc-800">
              {view === "month"
                ? new Date(monthStart + "T12:00:00Z").toLocaleDateString(
                    "pt-BR",
                    { timeZone: "UTC", month: "long", year: "numeric" },
                  )
                : labelDay(date)}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={view === "month" ? "Mês anterior" : "Dia anterior"}
                onClick={() => navigate(-1)}
                className="grid size-10 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => void setDate(today)}
                className="min-h-10 rounded-lg border border-zinc-200 bg-white px-4 text-xs text-zinc-600"
              >
                Hoje
              </button>
              <button
                type="button"
                aria-label={view === "month" ? "Próximo mês" : "Próximo dia"}
                onClick={() => navigate(1)}
                className="grid size-10 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        {view === "table" &&
          (rows.length ? (
            <AgendaTable rows={rows} timezone={timezone} />
          ) : (
            empty
          ))}
        {view === "day" && (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {Array.from(
              {
                length:
                  Math.max(
                    19,
                    ...selected.map(
                      (a) =>
                        Number(
                          hourLabel(a.session.startsAt, timezone).split(":")[0],
                        ) + 1,
                    ),
                  ) -
                  Math.min(
                    8,
                    ...selected.map((a) =>
                      Number(
                        hourLabel(a.session.startsAt, timezone).split(":")[0],
                      ),
                    ),
                  ) +
                  1,
              },
              (_, index) => {
                const hour =
                  Math.min(
                    8,
                    ...selected.map((a) =>
                      Number(
                        hourLabel(a.session.startsAt, timezone).split(":")[0],
                      ),
                    ),
                  ) + index;
                const bookings = selected.filter(
                  (a) =>
                    Number(
                      hourLabel(a.session.startsAt, timezone).split(":")[0],
                    ) === hour,
                );
                return (
                  <div
                    key={hour}
                    className="grid grid-cols-[52px_minmax(0,1fr)] border-b border-zinc-100 last:border-0 sm:grid-cols-[72px_minmax(0,1fr)]"
                  >
                    <span className="py-4 text-center text-xs tabular-nums text-zinc-400">
                      {String(hour).padStart(2, "0")}:00
                    </span>
                    <div className="min-h-16 min-w-0 border-l border-zinc-100 bg-zinc-50/40 p-3">
                      {bookings.length > 0 && (
                        <div className="grid gap-2 xl:grid-cols-2">
                          {bookings.map((a) => (
                            <Appointment
                              key={a.id}
                              booking={a}
                              timezone={timezone}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
        {view === "month" && (
          <>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(
                  (day) => (
                    <span
                      key={day}
                      className="py-3 text-center text-[11px] font-medium text-zinc-500"
                    >
                      {day}
                    </span>
                  ),
                )}
              </div>
              <div className="grid grid-cols-7">
                {Array.from(
                  { length: Math.ceil((offset + monthEnd) / 7) * 7 },
                  (_, i) => {
                    const n = i - offset + 1;
                    if (n < 1 || n > monthEnd)
                      return (
                        <div
                          key={i}
                          aria-hidden="true"
                          className="min-h-20 border-b border-r border-zinc-100 bg-zinc-50/50 sm:min-h-28"
                        />
                      );
                    const day =
                      date.slice(0, 7) + "-" + String(n).padStart(2, "0");
                    const events = grouped.get(day) ?? [];
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={date === day}
                        aria-label={`${labelDay(day)}, ${events.length} agendamentos`}
                        onClick={() => void setDate(day)}
                        className={`flex min-h-20 min-w-0 flex-col gap-2 border-b border-r border-zinc-100 p-2 text-left transition-colors sm:min-h-28 sm:p-3 ${date === day ? "bg-[#F5F4FF] ring-1 ring-inset ring-[#635BFF]" : "hover:bg-zinc-50"}`}
                      >
                        <span
                          className={`grid size-6 place-items-center rounded-full text-xs ${day === today ? "bg-[#635BFF] text-white" : "text-zinc-600"}`}
                        >
                          {n}
                        </span>
                        {events.length > 0 && (
                          <>
                            <span className="text-[10px] font-medium text-[#635BFF]">
                              {events.length}
                              <span className="hidden sm:inline">
                                {" "}
                                reservas
                              </span>
                            </span>
                            <span className="hidden w-full space-y-1 lg:block">
                              {events.slice(0, 2).map((event) => (
                                <span
                                  key={event.id}
                                  className="block truncate rounded-md bg-zinc-50 px-1.5 py-1 text-[10px] text-zinc-600"
                                >
                                  {hourLabel(event.session.startsAt, timezone)}{" "}
                                  · {event.session.service.name}
                                </span>
                              ))}
                              {events.length > 2 && (
                                <span className="block text-[10px] text-zinc-400">
                                  +{events.length - 2} agendamentos
                                </span>
                              )}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold capitalize text-zinc-700">
                {labelDay(date)}
              </h3>
              {selected.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {selected.map((a) => (
                    <Appointment key={a.id} booking={a} timezone={timezone} />
                  ))}
                </div>
              ) : (
                empty
              )}
            </div>
          </>
        )}
        {view === "timeline" &&
          (rows.length ? (
            <div className="space-y-8">
              {[...grouped].map(([day, bookings]) => (
                <section key={day} className="flex flex-col gap-5">
                  <h2 className="m-0 text-lg font-semibold capitalize text-zinc-800">
                    {labelDay(day)}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {bookings.map((a) => (
                      <Appointment key={a.id} booking={a} timezone={timezone} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            empty
          ))}
      </div>
    </div>
  );
}
