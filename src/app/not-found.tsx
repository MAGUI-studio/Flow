import { Container } from "@/components/container";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div id="inicio" className="mx-auto w-full max-w-[1200px]">
      <Header />
      <Container as="main" className="py-6 sm:py-10">
        <section
          aria-labelledby="not-found-title"
          className="relative isolate flex min-h-[560px] items-center justify-center overflow-hidden rounded-[28px] border border-[#eae7f3] bg-[#faf9fd] px-6 py-20 sm:min-h-[620px] sm:px-12"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-[62%] text-center font-[Manrope,Arial,sans-serif] text-[clamp(180px,40vw,480px)] leading-none font-black tracking-[-.09em] text-[#635BFF]/[0.065] select-none"
          >
            404
          </span>
          <div className="relative w-full max-w-lg pt-16 text-center sm:pt-24">
            <p className="text-[10px] font-semibold tracking-[.22em] text-[#635BFF] uppercase">
              Erro 404
            </p>
            <h1
              id="not-found-title"
              className="m-0! mt-5! text-3xl leading-[1.15] font-semibold tracking-[-.04em] sm:text-[44px]"
            >
              Página não encontrada
            </h1>
            <p className="mx-auto mt-5 max-w-sm text-sm leading-7 text-zinc-500">
              O endereço pode estar incorreto ou esta página não está mais
              disponível.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#635BFF] px-5 text-xs font-medium text-white transition-colors hover:bg-[#5046e5]"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Voltar ao início
              </Link>
              <Link
                href="/explorar"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-xs font-medium text-zinc-600 transition-colors hover:border-[#635BFF]/40 hover:text-[#635BFF]"
              >
                Explorar espaços
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <p className="absolute inset-x-6 bottom-7 text-center text-[11px] leading-6 text-zinc-400">
            Precisa de ajuda?{" "}
            <a
              href="mailto:contato@magui.studio"
              className="text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-[#635BFF]"
            >
              Entre em contato
            </a>
            .
          </p>
        </section>
      </Container>
      <Footer />
    </div>
  );
}
