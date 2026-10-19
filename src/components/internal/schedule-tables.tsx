"use client";
import { Fragment } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { formatContact } from "@/lib/format-contact";
import { BookingActions } from "./booking-actions";
import { DataTable } from "@/components/ui/data-table";
import { money, hourLabel, statusLabel, dayKey } from "@/lib/format";
const dateLabel = (date: Date, timezone: string) =>
  date.toLocaleDateString("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
function BookingStatus({ status }: { status: string }) {
  const color =
    status === "confirmed" || status === "completed"
      ? "bg-[#347759]"
      : status === "pending"
        ? "bg-amber-600"
        : status === "canceled" || status === "declined"
          ? "bg-rose-500"
          : "bg-zinc-400";
  return (
    <span className="inline-flex items-center gap-2 text-xs text-zinc-600">
      <span
        aria-hidden="true"
        className={`size-1.5 shrink-0 rounded-full ${color}`}
      />
      {statusLabel[status] ?? status}
    </span>
  );
}
type SessionRow = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  service: { id: string; name: string; priceCents: number };
  professional: { name: string };
  bookings: { id: string }[];
};
export function SessionsTable({
  rows,
  timezone,
}: {
  rows: SessionRow[];
  timezone: string;
}) {
  const [expanded, setExpanded] = useQueryState(
    "sessao",
    parseAsString.withOptions({ shallow: true, scroll: false }),
  );
  const groups = new Map<string, SessionRow[]>();
  for (const session of rows) {
    const key = session.service.id + ":" + dayKey(session.startsAt, timezone);
    groups.set(key, [...(groups.get(key) ?? []), session]);
  }
  return (
    <DataTable
      title="Sessões em grupo"
      count={rows.length}
      label="Sessões do estabelecimento"
      description={`Fuso: ${timezone}`}
      className="whitespace-nowrap"
      footer={`${rows.length} ${rows.length === 1 ? "sessão exibida" : "sessões exibidas"}`}
      columns={
        <>
          <th scope="col">Serviço</th>
          <th scope="col">Profissional</th>
          <th scope="col">Data</th>
          <th scope="col">Horário</th>
          <th scope="col">Vagas</th>
          <th scope="col">Disponibilidade</th>
          <th scope="col" className="text-right">
            Valor
          </th>
        </>
      }
    >
      {[...groups].map(([key, items]) => {
        items.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
        const multiple = items.length > 1;
        const open = expanded === key;
        const s = {
          ...items[0],
          capacity: items.reduce((total, item) => total + item.capacity, 0),
          bookings: items.flatMap((item) => item.bookings),
          professional: {
            name: [
              ...new Set(items.map((item) => item.professional.name)),
            ].join(" · "),
          },
        };
        return (
          <Fragment key={key}>
            <tr
              key={s.id}
              className={multiple ? "cursor-pointer" : undefined}
              onClick={
                multiple
                  ? (event) => {
                      if (!(event.target as HTMLElement).closest("button"))
                        void setExpanded(open ? null : key);
                    }
                  : undefined
              }
            >
              <th scope="row" className="font-normal">
                <span className="text-sm font-semibold text-zinc-800">
                  {s.service.name}
                </span>
              </th>
              <td className="text-xs text-zinc-600">{s.professional.name}</td>
              <td className="text-xs text-zinc-500">
                {dateLabel(s.startsAt, timezone)}
              </td>
              <td className="text-xs text-zinc-500">
                {multiple ? (
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={`session-group-${s.id}`}
                    onClick={() => void setExpanded(open ? null : key)}
                    className="inline-flex min-h-8 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-[#635BFF]"
                  >
                    {items.length} horários
                    <ChevronDown
                      size={14}
                      aria-hidden="true"
                      className={`transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : (
                  <>
                    {hourLabel(s.startsAt, timezone)} –{" "}
                    {hourLabel(s.endsAt, timezone)}
                  </>
                )}
              </td>
              <td>
                <div className="flex min-w-24 flex-col gap-2">
                  <span className="text-xs tabular-nums text-zinc-600">
                    {s.bookings.length} de {s.capacity} ocupadas
                  </span>
                  <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full transition-[width,background-color] motion-reduce:transition-none ${s.bookings.length >= s.capacity ? "bg-red-500" : s.bookings.length / s.capacity >= 0.75 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{
                        width: `${Math.min(100, (s.bookings.length / s.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </td>
              <td>
                <span className="inline-flex items-center gap-2 text-xs text-zinc-600">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${s.bookings.length >= s.capacity ? "bg-zinc-400" : "bg-[#347759]"}`}
                  />
                  {s.bookings.length >= s.capacity
                    ? "Turma completa"
                    : `${s.capacity - s.bookings.length} vagas livres`}
                </span>
              </td>
              <td className="text-right text-sm font-semibold text-zinc-700">
                {s.service.priceCents === 0
                  ? "Gratuito"
                  : money(s.service.priceCents)}
              </td>
            </tr>

            {multiple && open && (
              <tr id={`session-group-${s.id}`}>
                <td colSpan={7} className="bg-zinc-50">
                  <div className="overflow-x-auto">
                    <table
                      aria-label={`Horários de ${s.service.name}`}
                      className="w-full text-left text-xs"
                    >
                      <thead>
                        <tr className="text-zinc-400">
                          <th scope="col" className="pb-3 font-medium">
                            Horário
                          </th>
                          <th scope="col" className="pb-3 font-medium">
                            Profissional
                          </th>
                          <th scope="col" className="pb-3 font-medium">
                            Ocupação
                          </th>
                          <th scope="col" className="pb-3 font-medium">
                            Disponibilidade
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200/60">
                        {items.map((item) => (
                          <tr key={item.id} className="text-zinc-600">
                            <th scope="row" className="py-3 font-medium">
                              {hourLabel(item.startsAt, timezone)} –{" "}
                              {hourLabel(item.endsAt, timezone)}
                            </th>
                            <td className="py-3">{item.professional.name}</td>
                            <td className="py-3">
                              {item.bookings.length} de {item.capacity} vagas
                            </td>
                            <td className="py-3">
                              <span className="inline-flex items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className={`size-1.5 rounded-full ${item.bookings.length >= item.capacity ? "bg-zinc-400" : "bg-[#347759]"}`}
                                />
                                {item.bookings.length >= item.capacity
                                  ? "Turma completa"
                                  : `${item.capacity - item.bookings.length} vagas livres`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
    </DataTable>
  );
}
export type BookingRow = {
  arrivedAt?: Date | string | null;
  id: string;
  effectiveStatus: string;
  durationMinutes: number;
  priceCents: number;
  whatsapp: string | null;
  session: {
    startsAt: Date;
    service: { name: string };
    professional: { name: string };
  };
  actions: ReactNode;
};
export function AgendaTable({
  rows,
  timezone,
}: {
  rows: BookingRow[];
  timezone: string;
}) {
  return (
    <DataTable
      title="Seus agendamentos"
      count={rows.length}
      label="Agenda do estabelecimento"
      description={`Fuso: ${timezone}`}
      className="whitespace-nowrap"
      footer={`${rows.length} ${rows.length === 1 ? "agendamento exibido" : "agendamentos exibidos"}`}
      columns={
        <>
          <th scope="col">Serviço</th>
          <th scope="col">Profissional</th>
          <th scope="col">Data</th>
          <th scope="col">Horário</th>
          <th scope="col">Contato</th>
          <th scope="col" className="text-right">
            Valor
          </th>
          <th scope="col">Status</th>
          <th scope="col" className="text-right">
            Ações
          </th>
        </>
      }
    >
      {rows.map((a) => (
        <tr
          key={a.id}
          className={
            !["confirmed", "pending"].includes(a.effectiveStatus)
              ? "opacity-50"
              : undefined
          }
        >
          <th scope="row" className="font-normal">
            <span className="text-sm font-semibold text-zinc-800">
              {a.session.service.name}
            </span>
          </th>
          <td className="text-xs text-zinc-600">
            {a.session.professional.name}
          </td>
          <td className="text-xs text-zinc-500">
            {dateLabel(a.session.startsAt, timezone)}
          </td>
          <td className="text-xs text-zinc-500">
            {hourLabel(a.session.startsAt, timezone)}
            <span className="ml-2 text-zinc-400">
              · {a.durationMinutes} min
            </span>
          </td>
          <td className="text-xs text-zinc-500">{formatContact(a.whatsapp)}</td>
          <td className="text-right text-sm font-semibold text-zinc-700">
            {a.priceCents === 0 ? "Gratuito" : money(a.priceCents)}
          </td>
          <td>
            <BookingStatus status={a.effectiveStatus} />
          </td>
          <td className="text-right [&_.appointment-actions]:justify-end">
            {["confirmed", "pending"].includes(a.effectiveStatus) ? (
              <BookingActions
                id={a.id}
                status={a.effectiveStatus}
                arrivedAt={a.arrivedAt}
                startsAt={a.session.startsAt}
                iconOnly
                canComplete={new Date(a.session.startsAt) <= new Date()}
              />
            ) : (
              "—"
            )}
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
