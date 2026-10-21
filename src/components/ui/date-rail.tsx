"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
const dateObject = (iso: string) => new Date(iso + "T12:00:00Z");
export function DateRail({
  dates,
  value,
  onChange,
  loading,
  bookedDates = [],
}: {
  dates: string[];
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
  bookedDates?: string[];
}) {
  const [offset, setOffset] = useState(0);
  const signature = dates.join(",");
  useEffect(() => {
    const index = dates.indexOf(value);
    setOffset(index >= 0 ? Math.floor(index / 7) * 7 : 0);
  }, [signature]);
  const page = dates.slice(offset, offset + 7);
  const months = [...new Set(dates.map((d) => d.slice(0, 7)))];
  const first = page[0],
    last = page.at(-1);
  const monthLabel = first
    ? first.slice(0, 7) === last?.slice(0, 7)
      ? dateObject(first).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
      : `${dateObject(first).toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" })} – ${dateObject(last!).toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" })}`
    : "Datas disponíveis";
  return (
    <section
      className="date-rail"
      aria-label="Datas disponíveis"
      aria-busy={loading}
    >
      <div className="date-rail-heading">
        <div>
          <span className="date-rail-caption">ESCOLHA SEU DIA</span>
          <h3 aria-live="polite">{monthLabel}</h3>
        </div>
        <div className="date-rail-navigation">
          <button
            type="button"
            aria-label="Datas anteriores"
            disabled={offset === 0 || !dates.length}
            onClick={() => setOffset(Math.max(0, offset - 7))}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Próximas datas"
            disabled={offset + 7 >= dates.length}
            onClick={() => setOffset(offset + 7)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {months.length > 1 && (
        <div className="date-rail-months" aria-label="Meses disponíveis">
          {months.map((month) => (
            <button
              type="button"
              key={month}
              aria-pressed={first?.startsWith(month) ?? false}
              onClick={() =>
                setOffset(dates.findIndex((d) => d.startsWith(month)))
              }
            >
              {dateObject(month + "-01").toLocaleDateString("pt-BR", {
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })}
            </button>
          ))}
        </div>
      )}
      <div
        className="date-rail-days"
        role="group"
        aria-label="Selecione uma data"
      >
        {page.map((iso) => {
          const d = dateObject(iso);
          return (
            <button
              type="button"
              className={`date-rail-day ${bookedDates.includes(iso) && value !== iso ? "border-[#635BFF]/40 bg-[#F5F4FF]" : ""}`}
              key={iso}
              aria-label={d.toLocaleDateString("pt-BR", {
                dateStyle: "full",
                timeZone: "UTC",
              })}
              aria-pressed={value === iso}
              data-booked={bookedDates.includes(iso)}
              title={
                bookedDates.includes(iso)
                  ? "Você já tem agendamento neste dia"
                  : undefined
              }
              onClick={() => onChange(iso)}
            >
              <span>
                {d
                  .toLocaleDateString("pt-BR", {
                    weekday: "short",
                    timeZone: "UTC",
                  })
                  .replace(".", "")}
              </span>
              <strong>
                {d.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  timeZone: "UTC",
                })}
              </strong>
              <small>
                {d
                  .toLocaleDateString("pt-BR", {
                    month: "short",
                    timeZone: "UTC",
                  })
                  .replace(".", "")}
              </small>
              {bookedDates.includes(iso) ? (
                <em className={`date-rail-booked-marker ${value === iso ? "text-white" : "text-[#635BFF]"}`}>Agendado</em>
              ) : (
                <i aria-hidden="true" />
              )}
            </button>
          );
        })}
        {loading &&
          !dates.length &&
          Array.from({ length: 7 }, (_, i) => (
            <div className="date-rail-skeleton animate-pulse motion-reduce:animate-none" key={i} />
          ))}
      </div>
      {dates.length > 0 && !value && (
        <p className="date-rail-hint">
          <CalendarDays size={13} /> Selecione um dia para ver os horários
          livres.
        </p>
      )}
    </section>
  );
}
