"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { LoaderCircle, AlertCircle, X } from "lucide-react";
export function BookingActions({
  id,
  status,
  consumer = false,
  canCancel = true,
  canComplete = false,
}: {
  id: string;
  status: string;
  consumer?: boolean;
  canCancel?: boolean;
  canComplete?: boolean;
}) {
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState("");
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
  return (
    <div className="appointment-actions">
      {!consumer && status === "pending" && (
        <button
          className="button small"
          disabled={!!busy}
          onClick={() => void action("approve")}
        >
          {busy === "approve" ? "Aprovando…" : "Aprovar"}
        </button>
      )}
      {!consumer && status === "pending" && (
        <button
          className="action-secondary"
          disabled={!!busy}
          onClick={() => setConfirm("decline")}
        >
          Recusar
        </button>
      )}
      {!consumer && status === "confirmed" && canComplete && (
        <button
          className="action-secondary"
          disabled={!!busy}
          onClick={() => setConfirm("complete")}
        >
          Concluir
        </button>
      )}
      {canCancel && ["confirmed", "pending"].includes(status) && (
        <button
          className="action-text"
          disabled={!!busy}
          onClick={() => setConfirm("cancel")}
        >
          {consumer ? "Cancelar agendamento" : "Cancelar"}
        </button>
      )}
      {error && !confirm && (
        <p className="action-error" role="alert">
          {error}
        </p>
      )}
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
          <AlertDialog.Overlay className="flow-dialog-overlay" />
          <AlertDialog.Content className="flow-dialog">
            <span className="dialog-icon">
              <AlertCircle size={25} />
            </span>
            <AlertDialog.Title>
              {confirm === "cancel"
                ? "Cancelar este agendamento?"
                : confirm === "decline"
                  ? "Recusar esta solicitação?"
                  : "Concluir este atendimento?"}
            </AlertDialog.Title>
            <AlertDialog.Description>
              {confirm === "complete"
                ? "O atendimento será registrado como concluído no histórico."
                : "O horário será liberado. Se precisar de um novo atendimento, será necessário agendar novamente."}
            </AlertDialog.Description>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <AlertDialog.Cancel
                className="action-secondary"
                disabled={!!busy}
              >
                Voltar
              </AlertDialog.Cancel>
              <AlertDialog.Action
                className="button"
                disabled={!!busy}
                onClick={(event) => {
                  event.preventDefault();
                  void action(confirm);
                }}
              >
                {busy ? (
                  <>
                    <LoaderCircle size={15} className="spinning" />
                    Aguarde…
                  </>
                ) : confirm === "complete" ? (
                  "Concluir atendimento"
                ) : confirm === "decline" ? (
                  "Recusar solicitação"
                ) : (
                  "Sim, cancelar"
                )}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
