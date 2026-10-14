import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { AuthCalendar } from "./auth-calendar";
import { StudioCredit } from "./studio-credit";
import { Container } from "./container";
import type { ComponentProps } from "react";
const appearance: NonNullable<ComponentProps<typeof SignIn>["appearance"]> = {
  options: { socialButtonsVariant: "blockButton", logoPlacement: "none" },
  variables: {
    colorPrimary: "#635BFF",
    colorForeground: "#18181B",
    colorBackground: "#FFFFFF",
    borderRadius: "14px",
    fontFamily: "'DM Sans', Arial, sans-serif",
  },
  elements: {
    rootBox: "w-full!",
    cardBox: "w-full! border-0! shadow-none! rounded-none!",
    card: "w-full! bg-transparent! p-0! shadow-none! border-0!",
    header: "text-left!",
    headerTitle: "text-2xl! font-semibold! tracking-tight! text-zinc-900!",
    headerSubtitle: "mt-2! text-sm! leading-relaxed! text-zinc-500!",
    socialButtonsBlockButton:
      "h-12! rounded-xl! border! border-[#e8e5f6]! bg-white! px-4! shadow-none! transition-colors! hover:border-[#635BFF]! hover:bg-[#F5F4FF]! focus-visible:outline-[#635BFF]!",
    socialButtonsBlockButtonText: "text-sm! font-medium! text-zinc-800!",
    formButtonPrimary:
      "h-12! rounded-xl! bg-[#635BFF]! text-sm! shadow-none! hover:bg-[#5046E5]!",
    formFieldInput:
      "rounded-xl! border-zinc-200! shadow-none! focus:border-[#635BFF]!",
    footer: "mt-7! bg-transparent! p-0!",
    footerAction: "justify-start!",
    footerActionLink: "font-medium! text-[#635BFF]! hover:text-[#5046E5]!",
    footerActionText: "text-xs! text-zinc-500!",
  },
};
export async function AuthPage({
  mode,
  rootPage = true,
}: {
  mode: "sign-in" | "sign-up";
  rootPage?: boolean;
}) {
  const signup = mode === "sign-up";
  const { userId } = await auth();
  return (
    <Container
      as="main"
      className="mx-auto flex min-h-dvh max-w-[1200px] flex-col py-5 sm:py-8"
    >
      <header className="flex items-center justify-between gap-4 pb-7 sm:pb-10">
        <Link href="/" aria-label="Flow início">
          <img src="/brand/logo_black.svg" alt="Flow" className="w-24" />
        </Link>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-[#635BFF]"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-1 motion-reduce:transition-none"
          />
          Voltar para explorar
        </Link>
      </header>
      <div className="grid flex-1 items-stretch overflow-hidden rounded-[28px] border border-[#e8e5f6] bg-white lg:grid-cols-[1.05fr_1fr]">
        <section className="relative isolate flex flex-col justify-between overflow-hidden bg-[#F5F4FF] p-7 sm:p-10 lg:p-12">
          <img
            src="/brand/icon.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -right-14 -z-10 size-80 rotate-[-15deg] object-contain opacity-[0.07]"
          />
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e8e5f6] bg-white/80 px-3 py-2 text-[9px] font-semibold tracking-[.14em] text-[#635BFF] uppercase">
              <span className="size-1.5 rounded-full bg-[#635BFF]" />
              {signup
                ? "UM NOVO JEITO DE CUIDAR DO SEU TEMPO"
                : "BOM TER VOCÊ DE VOLTA"}
            </span>
            <h1 className="my-7 max-w-md text-4xl leading-[1.08] font-semibold tracking-[-.055em] sm:text-5xl lg:text-[56px]">
              {signup ? (
                <>
                  Seu tempo.
                  <br />
                  Seu começo.
                  <br />
                  Seu <span className="text-[#635BFF]">flow.</span>
                </>
              ) : (
                <>
                  Sua rotina.
                  <br />
                  Seus momentos.
                  <br />
                  Seu <span className="text-[#635BFF]">flow.</span>
                </>
              )}
            </h1>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
              {signup
                ? "Crie sua conta e descubra um jeito mais leve de agendar seus cuidados e organizar seu negócio."
                : "Volte para acompanhar seus agendamentos, organizar seu negócio e cuidar do que vem a seguir."}
            </p>
          </div>
          <AuthCalendar signup={signup} />
          <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Check size={12} className="text-[#635BFF]" />
              {signup
                ? "Encontre seu próximo cuidado"
                : "Seus agendamentos por perto"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={12} className="text-[#635BFF]" />
              {signup
                ? "Dê espaço ao seu negócio"
                : "Sua rotina em um só lugar"}
            </span>
          </div>
        </section>
        <section
          aria-label={signup ? "Criar sua conta" : "Entrar na sua conta"}
          className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-14"
        >
          <div className="mx-auto w-full max-w-sm">
            <span className="mb-6 block text-[9px] font-semibold tracking-[.16em] text-[#635BFF] uppercase">
              {signup ? "SEU PRIMEIRO PASSO NO FLOW" : "BEM-VINDO DE VOLTA"}
            </span>
            {userId && rootPage ? (
              <div>
                <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-[#F5F4FF] text-[#635BFF]">
                  <Check size={24} />
                </span>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Você já está no Flow.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  Sua conta está conectada. Confira seus agendamentos e escolha
                  seu próximo momento.
                </p>
                <Link href="/agendamentos" className="button group mt-6 w-full">
                  Meus agendamentos
                  <ArrowUpRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                  />
                </Link>
              </div>
            ) : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
              signup ? (
                <SignUp
                  routing="path"
                  path="/criar-conta"
                  signInUrl="/entrar"
                  fallbackRedirectUrl="/agendamentos"
                  appearance={appearance}
                />
              ) : (
                <SignIn
                  routing="path"
                  path="/entrar"
                  signUpUrl="/criar-conta"
                  fallbackRedirectUrl="/agendamentos"
                  appearance={appearance}
                />
              )
            ) : (
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Não foi possível carregar o acesso.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  Tente novamente em alguns instantes.
                </p>
              </div>
            )}
            <div className="mt-9 border-t border-zinc-100 pt-6">
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Uma conta para acompanhar seus agendamentos e cuidar do seu
                negócio.
              </p>
            </div>
          </div>
        </section>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 pt-6 text-[10px] text-zinc-400">
        <span>Seu tempo, em boa companhia.</span>
        <StudioCredit light />
      </footer>
    </Container>
  );
}
