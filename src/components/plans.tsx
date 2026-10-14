"use client";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
export function Plans({
  currentPlan,
  development,
}: {
  currentPlan: string | null;
  development: boolean;
}) {
  const { isSignedIn } = useUser(),
    clerk = useClerk(),
    router = useRouter();
  const [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  async function select(plan: string) {
    if (!isSignedIn) {
      await clerk.openSignIn({ forceRedirectUrl: window.location.href });
      return;
    }
    setBusy(plan);
    setError("");
    try {
      const r = await fetch(
        development ? "/api/subscription/development" : "/api/billing/checkout",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        },
      );
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      if (data.url) window.location.assign(data.url);
      else {
        router.push("/painel");
        router.refresh();
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível ativar o plano.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="plans">
        {[
          { id: "basic", name: "Essencial", count: 1 },
          { id: "multi", name: "Expandir", count: 3 },
        ].map((p, i) => (
          <section className={`panel plan ${i ? "featured" : ""}`} key={p.id}>
            <span className="badge">
              {p.count} {p.count === 1 ? "estabelecimento" : "estabelecimentos"}
            </span>
            <h2 style={{ marginTop: 20 }}>{p.name}</h2>
            <p className="muted-text">Assinatura mensal</p>
            <ul>
              <li>Até 10 profissionais por estabelecimento</li>
              <li>Sua mini página personalizada</li>
              <li>Serviços individuais e coletivos</li>
              <li>Agenda recorrente e datas específicas</li>
              <li>Aprovação automática ou manual</li>
              <li>Histórico de agendamentos</li>
            </ul>
            {currentPlan === p.id ? (
              <Link href="/painel" className="button full">
                Plano ativo · Abrir painel
              </Link>
            ) : (
              <button
                className="button full"
                disabled={!!busy}
                onClick={() => select(p.id)}
              >
                {busy === p.id
                  ? "Ativando…"
                  : !isSignedIn
                    ? "Entrar para assinar"
                    : currentPlan
                      ? "Mudar para este plano"
                      : "Assinar " + p.name}
              </button>
            )}
          </section>
        ))}
      </div>
      {development && (
        <p className="muted-text" style={{ textAlign: "center" }}>
          Neste ambiente de desenvolvimento, a ativação é imediata e não há
          cobrança.
        </p>
      )}
    </>
  );
}
