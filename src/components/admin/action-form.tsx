"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ShieldCheck, LoaderCircle, X } from "lucide-react";
import { adminActionSchema, type AdminActionInput } from "@/lib/admin-form";
import { performAdminAction } from "@/app/admin/actions";
import { notify } from "@/components/ui/flow-toaster";
export function AdminActionForm({
  target,
  action,
  label,
}: {
  target: string;
  action: AdminActionInput["action"];
  label: string;
}) {
  const router = useRouter(),
    [open, setOpen] = useState(false),
    [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminActionInput>({
    resolver: zodResolver(adminActionSchema),
    defaultValues: { target, action, reason: "", confirmed: false },
  });
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!isSubmitting) {
          setOpen(value);
          setMessage("");
        }
      }}
    >
      <AlertDialog.Trigger asChild>
        <button
          type="button"
          className="button secondary small whitespace-nowrap"
        >
          {label}
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm" />
        <AlertDialog.Content
          onEscapeKeyDown={(event) => {
            if (isSubmitting) event.preventDefault();
          }}
          className="fixed top-1/2 left-1/2 z-[1001] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#e8e5f0] bg-white shadow-2xl"
        >
          <div className="relative isolate overflow-hidden border-b border-zinc-100 p-6 sm:px-8">
            <ShieldCheck
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 -bottom-6 -z-10 size-36 text-[#635BFF]/[.07]"
            />
            <p className="text-[10px] font-medium tracking-widest text-[#635BFF] uppercase">
              Administração Flow
            </p>
            <AlertDialog.Title className="m-0! mt-3! text-xl font-semibold tracking-tight">
              {label}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-xs leading-6 text-zinc-500">
              Informe o motivo para registrar esta alteração no histórico da
              plataforma.
            </AlertDialog.Description>
            <AlertDialog.Cancel asChild>
              <button
                aria-label="Fechar confirmação"
                disabled={isSubmitting}
                className="absolute top-5 right-5 rounded-lg p-2 text-zinc-400 hover:bg-zinc-50"
              >
                <X size={16} />
              </button>
            </AlertDialog.Cancel>
          </div>
          <form
            className="space-y-5 p-6 sm:px-8"
            onSubmit={handleSubmit(async (values) => {
              setMessage("");
              try {
                const result = await performAdminAction(values);
                if (!result.ok) {
                  setMessage(result.error ?? "Não foi possível concluir.");
                  return;
                }
                reset();
                setOpen(false);
                notify.success(
                  "Alteração concluída",
                  "A ação foi registrada no histórico administrativo.",
                );
                router.refresh();
              } catch {
                setMessage(
                  "Falha de conexão. Seus dados foram preservados; confira o estado antes de tentar novamente.",
                );
              }
            })}
          >
            <label className="block text-xs font-medium text-zinc-700">
              Motivo da alteração
              <textarea
                {...register("reason")}
                rows={4}
                placeholder="Descreva o motivo desta ação"
                aria-invalid={!!errors.reason}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm font-normal leading-6 outline-none focus:border-[#635BFF]/50 focus:ring-2 focus:ring-[#635BFF]/10"
              />
            </label>
            {errors.reason && (
              <p role="alert" className="text-xs text-red-700">
                {errors.reason.message}
              </p>
            )}
            <label className="flex items-start gap-2.5 text-xs leading-6 text-zinc-600">
              <input
                type="checkbox"
                {...register("confirmed")}
                className="mt-1 size-4 accent-[#635BFF]"
              />
              Confirmo a alteração nesta conta ou estabelecimento.
            </label>
            {errors.confirmed && (
              <p role="alert" className="text-xs text-red-700">
                {errors.confirmed.message}
              </p>
            )}
            {message && (
              <p
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-6 text-red-700"
              >
                {message}
              </p>
            )}
            <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">
              <AlertDialog.Cancel asChild>
                <button
                  type="button"
                  disabled={isSubmitting}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-medium text-zinc-600 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </AlertDialog.Cancel>
              <button
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#635BFF] px-4 py-3 text-xs font-medium text-white hover:bg-[#5046e5] disabled:opacity-50"
              >
                {isSubmitting && (
                  <LoaderCircle
                    size={14}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                )}
                {isSubmitting ? "Salvando…" : "Confirmar alteração"}
              </button>
            </div>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
