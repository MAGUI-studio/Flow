import { Tooltip } from "@/components/ui/tooltip";
import { Check, UserCheck, X, CircleCheck, LoaderCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
export function BookingActionControls({
  status,
  busy = "",
  consumer = false,
  canCancel = true,
  canComplete = false,
  arrivedAt,
  canArrive = false,
  iconOnly = false,
  onAction,
  onConfirm,
}: {
  status: string;
  busy?: string;
  consumer?: boolean;
  canCancel?: boolean;
  canComplete?: boolean;
  arrivedAt?: Date | string | null;
  canArrive?: boolean;
  iconOnly?: boolean;
  onAction: (action: string) => void;
  onConfirm: (action: string) => void;
}) {
  function control(
    label: string,
    Icon: LucideIcon,
    action: string,
    confirm = false,
    disabled = false,
  ) {
    const button = (
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={!!busy || disabled}
        onClick={() => (confirm ? onConfirm(action) : onAction(action))}
        className={`my-0 inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF] disabled:cursor-default disabled:opacity-50 ${iconOnly ? "w-9 p-0" : "w-full border px-3 shadow-xs"} ${action === "arrive" && arrivedAt ? "border-emerald-200 bg-emerald-50 text-emerald-700" : !iconOnly && action === "arrive" ? "border-[#635BFF] bg-[#635BFF] text-white enabled:hover:bg-[#5046E5]" : !iconOnly ? "border-zinc-200 bg-white text-zinc-600 enabled:hover:bg-zinc-50" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"}`}
      >
        {busy === action ? (
          <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
        ) : (
          <Icon size={15} aria-hidden="true" />
        )}
        {!iconOnly && label}
      </button>
    );
    return iconOnly || (action === "arrive" && !canArrive && !arrivedAt) ? (
      <Tooltip
        className={iconOnly ? undefined : "w-full"}
        text={
          action === "arrive" && !canArrive && !arrivedAt
            ? "Disponível 1 hora antes do agendamento"
            : label
        }
      >
        {button}
      </Tooltip>
    ) : (
      button
    );
  }
  return (
    <>
      {!consumer && status === "pending" && (
        <>
          {control("Aprovar", Check, "approve")}
          {control("Recusar", X, "decline", true)}
        </>
      )}
      {!consumer &&
        status === "confirmed" &&
        canComplete &&
        control("Concluir", CircleCheck, "complete", true)}
      {canCancel &&
        ["confirmed", "pending"].includes(status) &&
        control(
          consumer ? "Cancelar agendamento" : "Cancelar",
          X,
          "cancel",
          true,
        )}
      {!consumer &&
        status === "confirmed" &&
        control(
          arrivedAt ? "Já chegou" : "Marcar chegada",
          arrivedAt ? Check : UserCheck,
          "arrive",
          false,
          !!arrivedAt || !canArrive,
        )}
    </>
  );
}
