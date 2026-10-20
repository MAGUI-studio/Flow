import { cn } from "@/lib/utils";
const variants = {
  active: { label: "Ativo", color: "bg-[#347759]" },
  inactive: { label: "Inativo", color: "bg-[#716879]" },
  vacation: { label: "Férias", color: "bg-[#90651f]" },
  scheduled_vacation: { label: "Férias agendadas", color: "bg-[#2563eb]" },
  confirmed: { label: "Confirmado", color: "bg-[#347759]" },
  completed: { label: "Concluído", color: "bg-[#347759]" },
  pending: { label: "Aguardando aprovação", color: "bg-[#90651f]" },
  canceled: { label: "Cancelado", color: "bg-rose-500" },
  declined: { label: "Recusado", color: "bg-rose-500" },
  expired: { label: "Expirado", color: "bg-zinc-400" },
  ended: { label: "Encerrado", color: "bg-zinc-400" },
  no_show: { label: "Não compareceu", color: "bg-zinc-400" },
  available: { label: "Vagas disponíveis", color: "bg-[#347759]" },
  full: { label: "Turma completa", color: "bg-zinc-400" },
} as const;
export type StatusBadgeStatus = keyof typeof variants;
export function StatusBadge({
  status,
  className,
  label: customLabel,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const { label, color } = variants[status as StatusBadgeStatus] ?? {
    label: status,
    color: "bg-zinc-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-zinc-600",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", color)}
      />
      {customLabel ?? label}
    </span>
  );
}
