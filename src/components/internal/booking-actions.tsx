"use client";
import { arrivalAvailable } from "@/lib/arrival-rules";
import { notify, useToastError } from "@/components/ui/flow-toaster";
import { BookingActionControls } from "./booking-action-controls";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { LoaderCircle, CalendarX2, CircleCheck } from "lucide-react";
export function BookingActions({
  id,
  status,
  consumer = false,
  canCancel = true,
  canComplete = false,
  arrivedAt,
  startsAt,
  iconOnly = false,
}: {
  id: string;
  status: string;
  consumer?: boolean;
  canCancel?: boolean;
  canComplete?: boolean;
  arrivedAt?: Date | string | null;
  startsAt?: Date | string;
  iconOnly?: boolean;
}) {
  const [busy, setBusy] = useState(""),
    [confirm, setConfirm] = useState("");
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const canArrive = !!startsAt && arrivalAvailable(startsAt, now);
  const setError = useToastError();
  const router = useRouter();
  async function action(value: string) {
    setBusy(value);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      notify.success(
        value === "arrive"
          ? "Chegada registrada"
          : value === "approve"
            ? "Agendamento aprovado"
            : value === "complete"
              ? "Atendimento concluído"
              : value === "decline"
                ? "Solicitação recusada"
                : "Agendamento cancelado",
      );
      setConfirm("");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível alterar o agendamento.",
      );
    } finally {
      setBusy("");
    }
  }
  if (!["confirmed", "pending"].includes(status)) return null;
  return (
    <div
      className={
        iconOnly
          ? "inline-flex flex-row flex-nowrap items-center justify-end gap-1 whitespace-nowrap"
          : "appointment-actions w-full! flex-col! items-stretch! sm:flex-row! sm:flex-nowrap! [&>button]:min-w-0 sm:[&>button]:flex-1 [&>span]:min-w-0 sm:[&>span]:flex-1"
      }
    >
      <BookingActionControls
        status={status}
        busy={busy}
        consumer={consumer}
        canCancel={canCancel}
        canComplete={canComplete}
        arrivedAt={arrivedAt}
        canArrive={canArrive}
        iconOnly={iconOnly}
        onAction={(value) => void action(value)}
        onConfirm={setConfirm}
      />

      <AlertDialog.Root
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setConfirm("");
            setError("");
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm" />
          <AlertDialog.Content
            onEscapeKeyDown={(event) => {
              if (busy) event.preventDefault();
            }}
            className="fixed left-1/2 top-1/2 z-[1001] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-[#e8e5f0] bg-white text-left shadow-2xl"
          >
            <div className="relative isolate overflow-hidden border-b border-[#efedf5] px-6 py-6 sm:px-8 sm:py-7">
              {confirm === "complete" ? (
                <CircleCheck
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-5 -bottom-8 -z-10 size-40 -rotate-12 text-[#635BFF] opacity-[0.06]"
                />
              ) : (
                <CalendarX2
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-5 -bottom-8 -z-10 size-40 -rotate-12 text-[#a45e75] opacity-[0.06]"
                />
              )}
              <p
                className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${confirm === "complete" ? "text-[#635BFF]" : "text-[#a45e75]"}`}
              >
                Organize sua agenda
              </p>
              <AlertDialog.Title className="m-0 text-2xl font-bold tracking-tight text-zinc-900">
                {confirm === "cancel"
                  ? "Cancelar este agendamento?"
                  : confirm === "decline"
                    ? "Recusar esta solicitação?"
                    : "Concluir este atendimento?"}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-zinc-500">
                {confirm === "complete"
                  ? "O atendimento será registrado como concluído no histórico."
                  : "O horário será liberado. Se precisar de um novo atendimento, será necessário agendar novamente."}
              </AlertDialog.Description>
            </div>
            <div className="grid grid-cols-1 gap-3 border-t border-[#efedf5] bg-[#faf9fd] px-6 py-5 sm:grid-cols-2 sm:px-8 sm:py-6">
              <AlertDialog.Cancel
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e3dfed] bg-white px-4 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:bg-[#F5F4FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#635BFF] disabled:opacity-50"
                disabled={!!busy}
              >
                {confirm === "complete" ? "Voltar" : "Manter agendamento"}
              </AlertDialog.Cancel>
              <AlertDialog.Action
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50 ${confirm === "complete" ? "bg-[#635BFF] hover:bg-[#5046E5] focus-visible:outline-[#635BFF]" : "bg-[#a45e75] hover:bg-[#8e4e63] focus-visible:outline-[#a45e75]"}`}
                disabled={!!busy}
                onClick={(event) => {
                  event.preventDefault();
                  void action(confirm);
                }}
              >
                {busy ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Aguarde…
                  </>
                ) : confirm === "complete" ? (
                  "Concluir atendimento"
                ) : confirm === "decline" ? (
                  "Recusar solicitação"
                ) : (
                  "Cancelar agendamento"
                )}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
