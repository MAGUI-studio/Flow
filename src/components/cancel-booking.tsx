"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function CancelBooking({ id }: { id: string }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  async function cancel() {
    if (!window.confirm("Deseja cancelar este agendamento?")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível cancelar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button className="text-button" disabled={busy} onClick={cancel}>
        {busy ? "Cancelando…" : "Cancelar agendamento"}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
