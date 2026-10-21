"use client";
import { Suspense, useEffect, useState } from "react";
import { useQueryState, parseAsStringEnum } from "nuqs";
import Link from "next/link";
import {
  CheckCircleIcon,
  ClockIcon,
  CircleNotchIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Container } from "@/components/container";
export default function SubscriptionReturn() {
  return (
    <Suspense fallback={<View state="waiting" />}>
      <Confirmation />
    </Suspense>
  );
}
function Confirmation() {
  const [plan] = useQueryState("plano", parseAsStringEnum(["basic", "multi"]));
  const [state, setState] = useState<
      "waiting" | "confirmed" | "delayed" | "signed-out"
    >("waiting"),
    [attempt, setAttempt] = useState(0),
    [nextUrl, setNextUrl] = useState("/painel/configuracao");
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>,
      tries = 0;
    setState("waiting");
    async function check() {
      try {
        const r = await fetch("/api/billing/status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (r.status === 401) {
          setState("signed-out");
          return;
        }
        const d = await r.json();
        if (controller.signal.aborted) return;
        if (r.ok && d.active && (!plan || d.plan === plan)) {
          setNextUrl(
            d.nextUrl === "/painel" ? "/painel" : "/painel/configuracao",
          );
          setState("confirmed");
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      if (++tries < 15) timer = setTimeout(check, 2000);
      else setState("delayed");
    }
    void check();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [plan, attempt]);
  return (
    <View
      state={state}
      plan={plan}
      nextUrl={nextUrl}
      retry={() => setAttempt((v) => v + 1)}
    />
  );
}
function View({
  state,
  plan,
  nextUrl = "/painel/configuracao",
  retry,
}: {
  state: "waiting" | "confirmed" | "delayed" | "signed-out";
  plan?: string | null;
  nextUrl?: string;
  retry?: () => void;
}) {
  const confirmed = state === "confirmed",
    waiting = state === "waiting";
  return (
    <Container
      as="main"
      className="flex min-h-svh flex-col items-center justify-center py-10 sm:py-16"
    >
      <Link href="/" aria-label="Flow — início" className="mb-8">
        <img src="/brand/logo_black.svg" alt="Flow" className="h-8 w-auto" />
      </Link>
      <section className="relative isolate w-full max-w-[520px] overflow-hidden rounded-[28px] border border-[#e8e5f6] bg-white px-6 py-9 text-center sm:px-10 sm:py-11">
        <img
          src="/brand/icon.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 -z-10 w-52 opacity-[0.035]"
        />
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#F5F4FF] text-[#635BFF]">
          {confirmed ? (
            <CheckCircleIcon size={32} weight="fill" />
          ) : waiting ? (
            <CircleNotchIcon size={28} className="motion-safe:animate-spin" />
          ) : (
            <ClockIcon size={28} />
          )}
        </div>
        <p className="mt-7 text-[10px] font-semibold tracking-[.16em] text-[#635BFF] uppercase">
          {plan === "basic"
            ? "Flow Essencial"
            : plan === "multi"
              ? "Flow PRO"
              : "Sua assinatura Flow"}
        </p>
        <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">
          {confirmed
            ? "Sua assinatura está confirmada!"
            : waiting
              ? "Confirmando sua assinatura"
              : state === "signed-out"
                ? "Entre para continuar"
                : "A confirmação está demorando"}
        </h1>
        <p role="status" className="mt-4 text-sm leading-7 text-zinc-500">
          {confirmed
            ? nextUrl === "/painel"
              ? "Seu acesso está pronto. Continue organizando seus atendimentos."
              : "Agora vamos preparar seu estabelecimento, sua equipe e os horários. Você pode concluir cada etapa no seu ritmo."
            : waiting
              ? "Estamos consultando a confirmação segura do seu pagamento. Não feche esta tela por enquanto."
              : state === "signed-out"
                ? "Sua sessão expirou. Entre novamente com a conta usada na assinatura."
                : "Ainda não recebemos a confirmação. Consulte novamente em instantes; não é necessário refazer o pagamento."}
        </p>
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#F5F4FF] p-4 text-left">
          <ShieldCheckIcon size={21} className="mt-1 shrink-0 text-[#635BFF]" />
          <p className="text-xs leading-6 text-zinc-600">
            {confirmed
              ? "O status foi confirmado pelo sistema de pagamentos. Seus dados ficam salvos a cada passo da configuração."
              : "O acesso só é liberado após a confirmação do Stripe. Esta tela não cria uma nova cobrança."}
          </p>
        </div>
        {confirmed ? (
          <Link href={nextUrl} className="button mt-7 w-full justify-center">
            {nextUrl === "/painel"
              ? "Acessar meu negócio"
              : "Configurar meu negócio"}
            <ArrowRightIcon size={18} />
          </Link>
        ) : state === "signed-out" ? (
          <Link
            href="/entrar?redirect_url=%2Fassinatura%2Fretorno"
            className="button mt-7 w-full justify-center"
          >
            Entrar na minha conta
          </Link>
        ) : (
          !waiting && (
            <button
              type="button"
              onClick={retry}
              className="button mt-7 w-full justify-center"
            >
              Consultar confirmação novamente
            </button>
          )
        )}
        <Link
          href="/agendamentos"
          className="mt-5 inline-flex text-xs text-zinc-500 hover:text-[#635BFF]"
        >
          Ir para minha área pessoal
        </Link>
      </section>
    </Container>
  );
}
