import Link from "next/link";
import { CalendarDays, Scissors } from "lucide-react";
import { AnimatedArrow } from "@/components/ui/animated-arrow";
import { panelHref } from "@/lib/url-state";
import { dayKey } from "@/lib/format";
type Props = {
  professional: {
    id: string;
    name: string;
    active: boolean;
    photo: { url: string } | null;
    vacationStartsAt: Date | null;
    vacationEndsAt: Date | null;
    services: { serviceId: string; service: { name: string } }[];
  };
  establishmentId: string;
  timezone: string;
};
export function ProfessionalCard({
  professional: p,
  establishmentId,
  timezone,
}: Props) {
  const vacation =
    p.active && !!p.vacationEndsAt && p.vacationEndsAt > new Date();
  const scheduled =
    vacation && !!p.vacationStartsAt && p.vacationStartsAt > new Date();
  const label = !p.active
    ? "Inativo"
    : vacation
      ? scheduled
        ? "Férias agendadas"
        : "Férias"
      : "Ativo";
  const tone = !p.active
    ? "border-zinc-200 bg-white text-zinc-500"
    : vacation
      ? "border-amber-100 bg-amber-50 text-amber-700"
      : "border-emerald-100 bg-emerald-50 text-emerald-700";
  return (
    <article className="group row-span-5 grid min-w-0 grid-rows-subgrid gap-y-0 overflow-hidden rounded-2xl border border-[#e8e5f0] bg-white bg-none transition-colors duration-200 hover:border-[#635BFF]/40">
      <div className="relative isolate flex items-start justify-between gap-3 overflow-hidden border-b border-[#efedf5] bg-[#faf9fd] bg-none px-5 py-4">
        <div
          className={`grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#eeebfa] text-2xl font-semibold tracking-tight text-[#635BFF] ${p.photo?.url ? "" : "border border-white ring-1 ring-[#e8e5f0]"}`}
        >
          {p.photo?.url ? (
            <img
              src={p.photo.url}
              alt={p.name}
              className="size-full object-cover"
            />
          ) : (
            p.name
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((word) => word[0])
              .join("")
              .toLocaleUpperCase("pt-BR")
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${tone}`}
        >
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-current"
          />
          {label}
        </span>
      </div>
      <div className="px-5 pt-4">
        <h2 className="m-0 break-words text-lg font-semibold leading-snug tracking-tight text-[#18181B]">
          {p.name}
        </h2>
        <p className="mb-0 mt-1 text-xs text-zinc-400">
          Profissional da sua equipe
        </p>
      </div>
      <div className="px-5">
        {vacation && p.vacationStartsAt && p.vacationEndsAt && (
          <p className="mb-0 mt-2 inline-flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-700">
            <CalendarDays
              size={13}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            {dayKey(p.vacationStartsAt, timezone)
              .split("-")
              .reverse()
              .join("/")}{" "}
            a{" "}
            {dayKey(new Date(p.vacationEndsAt.getTime() - 1), timezone)
              .split("-")
              .reverse()
              .join("/")}
          </p>
        )}
      </div>
      <div className="mx-5 mb-5 mt-4 border-t border-[#efedf5] pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            <Scissors size={12} aria-hidden="true" />
            Serviços vinculados
          </span>
          <span className="grid min-w-6 place-items-center rounded-md bg-[#F5F4FF] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#635BFF]">
            {p.services.length}
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {p.services.slice(0, 3).map((link) => (
            <span
              title={link.service.name}
              key={link.serviceId}
              className="max-w-full truncate rounded-lg border border-[#eceaf2] bg-[#fafafd] px-2 py-1 text-[11px] text-zinc-600"
            >
              {link.service.name}
            </span>
          ))}
          {p.services.length > 3 && (
            <span className="rounded-lg bg-[#F5F4FF] px-2 py-1 text-[11px] font-medium text-[#635BFF]">
              +{p.services.length - 3}
            </span>
          )}
          {!p.services.length && (
            <p className="m-0 py-1 text-xs leading-relaxed text-zinc-400">
              Nenhum serviço vinculado ainda.
            </p>
          )}
        </div>
      </div>
      <Link
        href={panelHref(
          `/painel/profissionais/${p.id}/editar`,
          establishmentId,
        )}
        className="group/edit flex items-center justify-between gap-3 border-t border-[#efedf5] px-5 py-3.5 text-xs font-semibold text-[#635BFF] transition-colors hover:bg-[#F5F4FF] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#635BFF]"
        aria-label={`Editar profissional ${p.name}`}
      >
        Editar profissional
        <AnimatedArrow
          direction="right"
          size={16}
          className="transition-transform group-hover/edit:translate-x-1"
        />
      </Link>
    </article>
  );
}
