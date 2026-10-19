"use client";
import { useCallback, useId } from "react";
import { Toaster, toast } from "sonner";
import { CheckCircle2, AlertCircle, Info, LoaderCircle, X } from "lucide-react";
type Kind = "success" | "error" | "info" | "loading";
const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  loading: LoaderCircle,
};
function show(
  kind: Kind,
  title: string,
  description?: string,
  id?: string | number,
) {
  const Icon = icons[kind];
  return toast.custom(
    (toastId) => (
      <div className="relative isolate w-[var(--width,356px)] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-[#e8e5f6] bg-white py-4 pl-5 pr-10 text-[#18181B] shadow-[0_12px_40px_#0000000d,0_2px_8px_#00000008]">
        <Icon
          aria-hidden="true"
          strokeWidth={1.6}
          className={`pointer-events-none absolute -right-3 -bottom-6 -z-10 size-28 rotate-[-16deg] opacity-[0.06] ${kind === "error" ? "text-[#a45e75]" : "text-[#635BFF]"} ${kind === "loading" ? "motion-safe:animate-spin" : ""}`}
        />
        <p className="m-0 text-sm font-semibold leading-relaxed tracking-tight">
          {title}
        </p>
        {description && (
          <p className="mb-0 mt-1 break-words text-xs leading-relaxed text-zinc-500">
            {description}
          </p>
        )}
        <button
          type="button"
          aria-label="Fechar notificação"
          onClick={() => toast.dismiss(toastId)}
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-[#F5F4FF] hover:text-[#635BFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF]"
        >
          <X size={15} />
        </button>
      </div>
    ),
    {
      id,
      duration: kind === "loading" ? Infinity : kind === "error" ? 6500 : 4000,
    },
  );
}
export const notify = {
  success: (title: string, description?: string, id?: string | number) =>
    show("success", title, description, id),
  error: (title: string, description?: string, id?: string | number) =>
    show("error", title, description, id),
  info: (title: string, description?: string, id?: string | number) =>
    show("info", title, description, id),
  loading: (title: string, description?: string, id?: string | number) =>
    show("loading", title, description, id),
  dismiss: (id: string | number) => toast.dismiss(id),
};
export function useToastError(title = "Não foi possível concluir") {
  const id = useId();
  return useCallback(
    (message: string) => {
      if (message) notify.error(title, message, id);
      else toast.dismiss(id);
    },
    [title, id],
  );
}
export function FlowToaster() {
  return (
    <Toaster
      position="top-right"
      offset={24}
      mobileOffset={16}
      visibleToasts={3}
      gap={12}
      containerAriaLabel="Notificações Flow"
    />
  );
}
