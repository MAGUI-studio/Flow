import Link from "next/link";
import { CalendarDays, UserRound } from "lucide-react";
import { AnimatedArrow } from "@/components/ui/animated-arrow";
import { StatusBadge } from "@/components/ui/statusBadge";
import { hourLabel } from "@/lib/format";
import type { UpcomingBooking } from "@/lib/upcoming-bookings";

export function UpcomingBookingNotice({
  bookings,
  businessName,
  timezone,
}: {
  bookings: UpcomingBooking[];
  businessName: string;
  timezone: string;
}) {
  return (
    <section
      aria-label="Seus agendamentos neste estabelecimento"
      className="relative isolate mb-6 overflow-hidden rounded-2xl border border-[#e8e5f6] bg-[#f8f7ff] p-4 sm:p-6"
    >
      <CalendarDays
        aria-hidden="true"
        strokeWidth={1}
        className="pointer-events-none absolute -top-8 -right-7 -z-10 size-48 rotate-[-12deg] text-[#635BFF] opacity-[0.055] sm:size-56"
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#e8e5f6] bg-white text-[#635BFF]">
            <CalendarDays size={21} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base! leading-6 font-semibold tracking-tight">
              {bookings.length === 1
                ? "Seu próximo momento já está marcado."
                : "Seus próximos momentos estão marcados."}
            </h2>
            <p className="mt-1 text-xs leading-6 text-zinc-500">
              {bookings.length === 1
                ? "Você tem um agendamento"
                : `Você tem ${bookings.length} agendamentos`}{" "}
              em {businessName}.
            </p>
          </div>
        </div>
        <Link
          href="/agendamentos"
          className="group inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e8e5f6] bg-white px-3.5 text-xs font-medium text-[#635BFF] transition-colors hover:border-[#635BFF]/40 hover:bg-[#f5f4ff]"
        >
          Ver agendamentos{" "}
          <AnimatedArrow
            direction="right"
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
      <ul className="grid gap-3">
        {bookings.map((booking) => {
          const date = new Date(booking.startsAt);
          const day = date.toLocaleDateString("pt-BR", {
            timeZone: timezone,
            day: "2-digit",
          });
          const month = date
            .toLocaleDateString("pt-BR", { timeZone: timezone, month: "short" })
            .replace(".", "");
          const weekday = date.toLocaleDateString("pt-BR", {
            timeZone: timezone,
            weekday: "long",
          });
          return (
            <li
              key={booking.id}
              className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-[#e8e5f6] bg-white px-4 py-4 sm:flex-nowrap"
            >
              <div className="flex shrink-0 items-center gap-3.5 sm:w-48">
                <div
                  aria-hidden="true"
                  className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[#e8e5f6] bg-[#f5f4ff]"
                >
                  <span className="text-[22px] leading-6 font-semibold tracking-tight text-[#635BFF]">
                    {day}
                  </span>
                  <span className="mt-0.5 text-[9px] font-semibold tracking-widest text-[#635BFF] uppercase">
                    {month}
                  </span>
                </div>
                <div>
                  <time
                    dateTime={booking.startsAt}
                    aria-label={date.toLocaleString("pt-BR", {
                      timeZone: timezone,
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                    className="block text-xl leading-7 font-semibold tracking-tight tabular-nums text-zinc-900"
                  >
                    {hourLabel(booking.startsAt, timezone)}
                  </time>
                  <span className="mt-0.5 block text-[11px] capitalize text-zinc-400">
                    {weekday}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1 basis-40 sm:basis-auto">
                <strong className="block text-sm leading-6 font-semibold text-zinc-800">
                  {booking.serviceName}
                </strong>
                <p className="mt-1 flex items-center gap-1.5 text-xs leading-5 text-zinc-500">
                  <UserRound
                    size={12}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  {booking.professionalName}
                </p>
              </div>
              <StatusBadge
                status={booking.status}
                className="ml-auto rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1.5 text-[11px]"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
