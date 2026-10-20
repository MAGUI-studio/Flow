"use client";
import { useState } from "react";
import { useToastError } from "@/components/ui/flow-toaster";

export function BillingPortalButton() {
  const [busy, setBusy] = useState(false);
  const setError = useToastError();
  async function open() {
    setBusy(true);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir a gestão de pagamentos.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <button type="button" className="button" disabled={busy} onClick={open}>
      {busy ? "Abrindo…" : "Gerenciar pagamentos e cancelamento"}
    </button>
  );
}
