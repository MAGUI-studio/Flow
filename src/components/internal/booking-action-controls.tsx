export function BookingActionControls({
  status,
  busy = "",
  consumer = false,
  canCancel = true,
  canComplete = false,
  onAction,
  onConfirm,
}: {
  status: string;
  busy?: string;
  consumer?: boolean;
  canCancel?: boolean;
  canComplete?: boolean;
  onAction: (action: string) => void;
  onConfirm: (action: string) => void;
}) {
  return (
    <>
      {!consumer && status === "pending" && (
        <>
          <button
            data-approve
            className="button small my-0 h-9 min-h-9 py-0 leading-none"
            disabled={!!busy}
            onClick={() => onAction("approve")}
          >
            {busy === "approve" ? "Aprovando…" : "Aprovar"}
          </button>
          <button
            className="action-secondary my-0 inline-flex h-9 min-h-9 items-center justify-center py-0 leading-none"
            disabled={!!busy}
            onClick={() => onConfirm("decline")}
          >
            Recusar
          </button>
        </>
      )}
      {!consumer && status === "confirmed" && canComplete && (
        <button
          className="action-secondary my-0 inline-flex h-9 min-h-9 items-center justify-center py-0 leading-none"
          disabled={!!busy}
          onClick={() => onConfirm("complete")}
        >
          Concluir
        </button>
      )}
      {canCancel && ["confirmed", "pending"].includes(status) && (
        <button
          className="action-text my-0 inline-flex h-9 min-h-9 items-center justify-center py-0 leading-none"
          disabled={!!busy}
          onClick={() => onConfirm("cancel")}
        >
          {consumer ? "Cancelar agendamento" : "Cancelar"}
        </button>
      )}
    </>
  );
}
