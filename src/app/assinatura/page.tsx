import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/container";
import { BillingPortalButton } from "@/components/billing-portal-button";
import { planFeatures } from "@/lib/plan-features";
import { billingSummary } from "@/lib/stripe";

export default async function SubscriptionPage() {
  const { userId } = await auth.protect();
  const sub = await prisma().subscription.findUnique({
    where: { ownerId: userId },
  });
  const connected = sub?.provider === "stripe" && !!sub.stripeCustomerId;
  const active = sub?.status === "active" && sub.paidUntil > new Date();
  const summary = sub ? await billingSummary(sub) : null;
  return (
    <Container as="main" className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 sm:p-10">
        <Link href="/" className="text-xs text-zinc-500">
          ← Voltar ao Flow
        </Link>
        <p className="mt-8 text-[10px] font-medium tracking-widest text-[#635BFF] uppercase">
          Sua conta
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Minha assinatura
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600">
          {connected
            ? active
              ? `Seu plano ${planFeatures(sub!.plan).name} está disponível até ${sub!.paidUntil.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`
              : "Consulte sua assinatura, atualize o cartão ou resolva um pagamento pendente para recuperar o acesso."
            : "Escolha o plano que acompanha seu negócio e comece com 7 dias grátis na primeira assinatura."}
        </p>
        {connected && (
          <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50 p-5">
            <p className="m-0 text-2xl font-semibold tracking-tight">
              {sub!.plan === "multi" ? "R$ 89,90" : "R$ 49,90"}
              <span className="text-xs font-normal text-zinc-500"> /mês</span>
            </p>
            {summary?.trialEnd && (
              <p className="mt-3 text-sm text-[#635BFF]">
                Período grátis até{" "}
                {new Date(summary.trialEnd * 1000).toLocaleDateString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}
                .{" "}
                {summary.cancelAtPeriodEnd
                  ? "O teste será encerrado sem renovar."
                  : "A primeira cobrança acontece ao finalizar o teste."}
              </p>
            )}
            {sub!.cancelAtPeriodEnd && (
              <p className="mt-3 text-xs text-amber-700">
                Cancelamento agendado para o fim do período atual. Você pode
                reativar a renovação na gestão de pagamentos.
              </p>
            )}
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {connected && <BillingPortalButton />}
          <Link className="button" href="/#planos">
            {connected ? "Comparar e alterar plano" : "Conhecer os planos"}
          </Link>
          {active && (
            <Link className="button" href="/painel">
              Ir ao painel
            </Link>
          )}
        </div>
      </div>
    </Container>
  );
}
