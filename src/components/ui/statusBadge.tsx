import { cn } from "@/lib/utils";
const variants = {
  active: { label: "Ativo", color: "bg-[#347759]" },
  inactive: { label: "Inativo", color: "bg-[#716879]" },
  vacation: { label: "Férias", color: "bg-[#90651f]" },
  scheduled_vacation: { label: "Férias agendadas", color: "bg-[#2563eb]" },
} as const;
export type StatusBadgeStatus = keyof typeof variants;
export function StatusBadge({
  status,
  className,
}: {
  status: StatusBadgeStatus;
  className?: string;
}) {
  const { label, color } = variants[status];
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
      {label}
    </span>
  );
}
