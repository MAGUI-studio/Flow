"use client";
import { Suspense, useEffect, useState } from "react";
import { useQueryState, parseAsStringEnum } from "nuqs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Clock3, LoaderCircle, ShieldCheck } from "lucide-react";
import { Container } from "@/components/container";

export default function SubscriptionReturn() {
  return (
    <Suspense fallback={<ConfirmationView waiting />}>
      <Confirmation />
    </Suspense>
  );
}
function Confirmation() {
  const [plan] = useQueryState("plano", parseAsStringEnum(["basic", "multi"]));
  const router = useRouter();
  const [waiting, setWaiting] = useState(true);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    async function check() {
      try {
        const response = await fetch("/api/billing/status", {
          cache: "no-store",
        });
        const data = await response.json();
        if (
          !stopped &&
          response.ok &&
          data.active &&
          (!plan || data.plan === plan)
        ) {
          router.replace("/painel");
          router.refresh();
          return;
        }
      } catch {
        /* Keep waiting for the verified webhook. */
      }
      if (stopped) return;
      if (++attempts < 30) timer = setTimeout(check, 2000);
      else setWaiting(false);
    }
    void check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [router, plan]);
  return <ConfirmationView waiting={waiting} plan={plan} />;
}

function ConfirmationView({
  waiting,
  plan,
}: {
  waiting: boolean;
  plan?: string | null;
}) {
  return (
    <Container
      as="main"
      className="flex min-h-svh flex-col items-center justify-center py-10 sm:py-16"
    >
      <Link
        href="/"
        aria-label="Flow — página inicial"
        className="mb-8 sm:mb-10"
      >
        <img src="/brand/logo_black.svg" alt="Flow" className="h-8 w-auto" />
      </Link>
      <section
        aria-labelledby="confirmation-title"
        className="relative isolate w-full max-w-[520px] overflow-hidden rounded-[28px] border border-[#e8e5f6] bg-white px-6 py-9 text-center shadow-[0_16px_64px_-32px_rgba(45,35,95,0.2)] sm:px-10 sm:py-11"
      >
        <img
          src="/brand/icon.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 -z-10 w-52 opacity-[0.035]"
        />
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-[#e8e5f6] bg-[#f5f4ff] text-[#635bff]">
          {waiting ? (
            <LoaderCircle
              size={28}
              aria-hidden="true"
              className="motion-safe:animate-spin"
            />
          ) : (
            <Clock3 size={28} aria-hidden="true" />
          )}
        </div>
        <p className="mt-7 text-[10px] font-semibold tracking-[0.16em] text-[#635bff] uppercase">
          {plan === "basic"
            ? "Flow Essencial"
            : plan === "multi"
              ? "Flow PRO"
              : "Sua assinatura Flow"}
        </p>
        <h1
          id="confirmation-title"
          className="mx-auto mt-3 mb-0 max-w-[360px] text-[28px] leading-[1.25] font-semibold tracking-[-0.025em] text-zinc-900 sm:text-[32px]"
        >
          {waiting ? "Confirmando sua assinatura" : "Só mais um instante"}
        </h1>
        <p
          role="status"
          className="mx-auto mt-4 max-w-[360px] text-sm leading-7 text-zinc-500"
        >
          {waiting
            ? "Estamos preparando seu acesso ao Flow. Assim que sua assinatura for confirmada, seu painel abrirá automaticamente."
            : "A confirmação está levando um pouco mais de tempo. Você pode consultar o andamento pelo seu painel."}
        </p>
        <div className="mt-7 flex items-start gap-3 rounded-2xl border border-[#e8e5f6] bg-[#f8f7ff] p-4 text-left">
          <ShieldCheck
            size={20}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[#635bff]"
          />
          <div>
            <p className="text-xs font-semibold leading-5 text-zinc-700">
              Confirmação segura
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Estamos conferindo os dados com o Stripe. Não é necessário refazer
              o pagamento.
            </p>
          </div>
        </div>
        <Link
          href="/painel"
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#635bff] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#5046e5] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#635bff]"
        >
          Acessar meu painel
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <p className="mt-4 text-xs leading-5 text-zinc-400">
          Seu próximo passo começa por aqui.
        </p>
      </section>
      <p className="mt-7 text-xs text-zinc-400">Seu tempo, em boa companhia.</p>
    </Container>
  );
}
