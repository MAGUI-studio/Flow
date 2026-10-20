import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Alterar plano",
  "Confira os detalhes do novo plano e o ajuste de cobrança antes de confirmar a alteração.",
  "/assinatura/alterar",
  true,
);
import { auth } from "@clerk/nextjs/server";
import { createLoader, parseAsStringEnum } from "nuqs/server";
import { Container } from "@/components/container";
import { SubscriptionChangeForm } from "@/components/subscription-change-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
const load = createLoader({
  plano: parseAsStringEnum(["basic", "multi"]).withDefault("multi"),
});
export default async function ChangeSubscription({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await auth.protect();
  const query = await load(searchParams);
  return (
    <Container as="main" className="min-h-svh py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between gap-4 border-b border-[#e8e5f6] pb-6 sm:mb-12">
          <Link href="/" aria-label="Flow — página inicial">
            <img
              src="/brand/logo_black.svg"
              alt="Flow"
              className="h-8 w-auto"
            />
          </Link>
          <Link
            href="/assinatura"
            className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-zinc-500 transition-colors hover:text-[#635BFF]"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Minha assinatura
          </Link>
        </header>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-[#635BFF] uppercase">
          Minha assinatura
        </p>
        <h1 className="mt-3 mb-0 text-[30px] leading-tight font-semibold tracking-[-0.035em] sm:text-[40px]">
          Um novo passo para o seu negócio.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-500">
          Confira o que muda no seu plano e revise os valores antes de
          confirmar.
        </p>
        <SubscriptionChangeForm plan={query.plano as "basic" | "multi"} />
      </div>
    </Container>
  );
}
