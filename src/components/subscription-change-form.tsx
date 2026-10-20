"use client";
import { FormSubmitGuard } from "@/components/ui/form-feedback";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { planFeatures } from "@/lib/plan-features";
import {
  ArrowUpRight,
  Check,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

const schema = z.object({
  plan: z.enum(["basic", "multi"]),
  token: z.string().min(1, "Aguarde a prévia de cobrança."),
  agree: z
    .boolean()
    .refine(Boolean, "Confirme que deseja alterar sua assinatura."),
});
type Values = z.infer<typeof schema>;
type Quote = {
  token: string;
  amountDue: number;
  credit: number;
  trialEnd: number | null;
  currency: string;
};
const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function SubscriptionChangeForm({ plan }: { plan: "basic" | "multi" }) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { plan, token: "", agree: false },
  });
  const { setValue } = form;
  const agreed = form.watch("agree");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setQuote(null);
    setValue("token", "");
    fetch("/api/billing/change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data as Quote;
      })
      .then((data) => {
        setQuote(data);
        setValue("token", data.token);
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : "Não foi possível calcular a alteração.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [plan, attempt, setValue]);
  async function submit(values: Values) {
    setError("");
    try {
      const response = await fetch("/api/billing/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: values.plan, token: values.token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.url) window.location.assign(data.url);
      else {
        router.replace(`/assinatura/retorno?plano=${plan}`);
        router.refresh();
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível alterar o plano.",
      );
    }
  }
  const details = planFeatures(plan);
  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      className="mt-9 grid items-start gap-6 lg:mt-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8"
    >
      <input type="hidden" {...form.register("plan")} />
      <input type="hidden" {...form.register("token")} />
      <aside className="relative isolate overflow-hidden rounded-[26px] border border-[#e8e5f6] bg-[#F5F4FF] p-6 sm:p-8">
        <img
          src="/brand/icon.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -top-7 -right-9 -z-10 w-44 opacity-[0.05]"
        />
        <p className="m-0 inline-flex rounded-full border border-[#635BFF]/15 bg-white px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#635BFF] uppercase">
          Seu novo plano
        </p>
        <h2 className="mt-6 text-[28px] leading-tight font-semibold tracking-tight">
          {plan === "multi" ? "Flow PRO" : "Flow Essencial"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          {plan === "multi"
            ? "Mais espaço para sua equipe e liberdade para crescer."
            : "Tudo para organizar sua unidade e cuidar de cada agendamento."}
        </p>
        <p className="mt-7 text-[36px] leading-tight font-semibold tracking-tight text-zinc-900">
          {money(plan === "multi" ? 8990 : 4990)}
          <span className="text-sm font-normal tracking-normal text-zinc-500">
            {" "}
            /mês
          </span>
        </p>
        <ul className="mt-7 space-y-4 border-t border-[#e1ddf5] pt-6 text-sm leading-6 text-zinc-600">
          {[
            `Até ${details.establishments} ${details.establishments === 1 ? "estabelecimento" : "estabelecimentos"}`,
            `${details.professionals} profissionais por estabelecimento`,
            "Agenda e gestão dos seus serviços",
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check
                size={16}
                aria-hidden="true"
                className="mt-1 shrink-0 text-[#635BFF]"
              />
              {feature}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs leading-6 text-zinc-500">
          O valor mensal passa a ser o do plano escolhido. Confira no resumo o
          ajuste desta mudança.
        </p>
      </aside>
      <div className="rounded-[26px] border border-[#e8e5f6] bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F5F4FF] text-[#635BFF]">
            <CreditCard size={19} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Resumo da alteração
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Revise os valores antes de continuar.
            </p>
          </div>
        </div>
        <div
          aria-live="polite"
          aria-busy={loading}
          className="text-sm leading-relaxed text-zinc-600"
        >
          {loading ? (
            <div
              role="status"
              className="flex items-center gap-3 rounded-2xl bg-[#f8f7ff] p-5 text-sm leading-6"
            >
              <LoaderCircle
                size={19}
                aria-hidden="true"
                className="shrink-0 text-[#635BFF] motion-safe:animate-spin"
              />
              <p>Calculando o ajuste da sua assinatura…</p>
            </div>
          ) : (
            quote && (
              <>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#e8e5f6] bg-[#f8f7ff] p-5">
                  <span className="text-xs font-medium">Cobrança agora</span>
                  <strong className="text-2xl font-semibold tracking-tight text-zinc-900">
                    {money(quote.amountDue)}
                  </strong>
                </div>
                {quote.credit > 0 && (
                  <p className="mt-3">
                    Crédito de {money(quote.credit)} para próximas faturas. Não
                    há reembolso automático no cartão.
                  </p>
                )}
                <p className="mt-4 text-xs leading-6">
                  {quote.trialEnd
                    ? `Você continua no período grátis até ${new Date(quote.trialEnd * 1000).toLocaleDateString("pt-BR")}. Depois, será cobrado o valor mensal do novo plano.`
                    : "O ajuste proporcional considera o tempo restante do período atual. A data da renovação mensal é mantida."}
                </p>
              </>
            )
          )}
        </div>
        {quote && (
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-4 text-xs leading-6 text-zinc-600 transition-colors hover:border-[#635BFF]/40 has-checked:border-[#635BFF]/40 has-checked:bg-[#f8f7ff]">
            <input
              type="checkbox"
              {...form.register("agree")}
              aria-invalid={!!form.formState.errors.agree}
              aria-describedby="agreement-error"
              className="mt-0.5 size-4 shrink-0 accent-[#635BFF]"
            />
            <span>
              Confirmo a mudança para{" "}
              {plan === "multi" ? "Flow PRO" : "Flow Essencial"} e o ajuste de
              cobrança acima.
            </span>
          </label>
        )}
        {form.formState.errors.agree && (
          <p
            id="agreement-error"
            role="alert"
            className="mt-2 text-xs text-red-600"
          >
            {form.formState.errors.agree.message}
          </p>
        )}
        {form.formState.errors.token && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {form.formState.errors.token.message}
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-3 text-xs font-semibold underline underline-offset-4"
            >
              Atualizar prévia
            </button>
            <Link
              href="/assinatura"
              className="ml-4 text-xs underline underline-offset-4"
            >
              Gerenciar pagamento
            </Link>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <FormSubmitGuard
            schema={schema}
            values={form.watch()}
            className="w-full"
          >
            <button
              type="submit"
              disabled={
                loading || !quote || !agreed || form.formState.isSubmitting
              }
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#635BFF] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#5046E5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {form.formState.isSubmitting
                ? "Alterando…"
                : "Confirmar alteração"}
              {form.formState.isSubmitting ? (
                <LoaderCircle
                  size={17}
                  aria-hidden="true"
                  className="motion-safe:animate-spin"
                />
              ) : (
                <ArrowUpRight size={17} aria-hidden="true" />
              )}
            </button>
          </FormSubmitGuard>
          <Link
            href="/assinatura"
            className="inline-flex min-h-10 items-center justify-center px-4 text-xs font-medium text-zinc-500 hover:text-[#635BFF]"
          >
            Voltar à assinatura
          </Link>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 border-t border-zinc-100 pt-5 text-[11px] leading-5 text-zinc-400">
          <ShieldCheck size={14} aria-hidden="true" className="shrink-0" />
          Pagamento protegido pelo Stripe
        </p>
      </div>
    </form>
  );
}
