"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import type { SubscriptionPlan } from "@/lib/subscription-flow";

export function CheckoutContinuation({
  plan,
  development,
}: {
  plan: SubscriptionPlan;
  development: boolean;
}) {
  const router = useRouter();
  const started = useRef(false);
  const active = useRef(true);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const start = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        development ? "/api/subscription/development" : "/api/billing/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        },
      );
      const result = await response.json();
      if (!active.current) return;
      if (!response.ok)
        throw new Error(result.error || "Não foi possível abrir o pagamento.");
      if (result.url) window.location.assign(result.url);
      else if (result.active) {
        router.replace("/painel");
        router.refresh();
      } else
        throw new Error("Não foi possível abrir o pagamento. Tente novamente.");
    } catch (failure) {
      if (!active.current) return;
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível abrir o pagamento.",
      );
      setBusy(false);
    }
  }, [plan, development, router]);

  useEffect(() => {
    active.current = true;
    if (!started.current) {
      started.current = true;
      void start();
    }
    return () => {
      active.current = false;
    };
  }, [start]);

  return (
    <section
      className="mx-auto max-w-lg rounded-[26px] border border-[#E8E5F6] bg-white p-7 text-center sm:p-10"
      aria-busy={busy}
    >
      <img
        src="/brand/logo_black.svg"
        alt="Flow"
        className="mx-auto h-8 w-auto"
      />
      <p className="mt-8 text-[10px] font-medium tracking-widest text-[#635BFF] uppercase">
        Flow {plan === "basic" ? "Essencial" : "PRO"}
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {busy
          ? "Seu próximo passo está pronto."
          : "Vamos continuar sua assinatura?"}
      </h1>
      {busy ? (
        <p
          role="status"
          className="mt-4 flex items-center justify-center gap-2 text-sm leading-relaxed text-zinc-500"
        >
          <LoaderCircle
            aria-hidden="true"
            size={17}
            className="shrink-0 motion-safe:animate-spin"
          />
          {development
            ? "Preparando seu painel…"
            : "Abrindo o pagamento seguro no Stripe…"}
        </p>
      ) : (
        <>
          <p role="alert" className="mt-4 text-sm leading-relaxed text-red-600">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void start()}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#635BFF] px-5 text-sm font-medium text-white hover:bg-[#5046E5]"
          >
            Tentar novamente
          </button>
          <Link
            href="/assinatura"
            className="mt-4 block text-xs text-[#635BFF] underline underline-offset-4"
          >
            Ver minha assinatura e pagamentos
          </Link>
        </>
      )}
      <Link
        href="/#planos"
        className="mt-6 inline-block text-xs text-zinc-500 underline underline-offset-4"
      >
        Voltar aos planos
      </Link>
    </section>
  );
}
