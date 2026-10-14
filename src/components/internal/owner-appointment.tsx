import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { money, hourLabel, statusLabel } from "@/lib/format";
import { StatusPill } from "./primitives";
export function OwnerAppointment({
  startsAt,
  timezone,
  service,
  professional,
  durationMinutes,
  priceCents,
  status,
  whatsapp,
  actions,
}: {
  startsAt: Date | string;
  timezone: string;
  service: string;
  professional: string;
  durationMinutes: number;
  priceCents: number;
  status: string;
  whatsapp?: string | null;
  actions: ReactNode;
}) {
  const date = new Date(startsAt);
  return (
    <article className="owner-appointment">
      <div className="appointment-date-block">
        <strong>
          {date.toLocaleDateString("pt-BR", {
            timeZone: timezone,
            day: "2-digit",
          })}
        </strong>
        <span>
          {date.toLocaleDateString("pt-BR", {
            timeZone: timezone,
            month: "short",
          })}
        </span>
      </div>
      <div className="owner-appointment-main">
        <div>
          <h2>{service}</h2>
          <StatusPill status={status} label={statusLabel[status]} />
        </div>
        <p>
          <Clock size={13} />
          {hourLabel(date, timezone)} · {durationMinutes} min
          <span>Com {professional}</span>
        </p>
        {whatsapp && <small>WhatsApp: {whatsapp}</small>}
      </div>
      <strong className="owner-appointment-price">{money(priceCents)}</strong>
      {actions}
    </article>
  );
}
