import { pageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Container } from "@/components/container";
import { BusinessDirectory } from "@/components/business-directory";
import { catalog } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Explore serviços e profissionais",
  "Encontre estabelecimentos e profissionais por cidade, categoria ou atendimento online. Compare serviços e escolha seu próximo horário.",
  "/explorar",
);

export default async function Page() {
  const businesses = await catalog();
  return (
    <div id="inicio" className="mx-auto w-full max-w-[1200px] overflow-x-clip">
      <Header />
      <Container as="main" className="pt-10 pb-20 sm:pt-14">
        <div className="mb-10">
          <span className="text-[10px] font-medium tracking-[0.15em] text-[#635BFF] uppercase">
            Seu próximo momento está aqui
          </span>
          <h1 className="mt-4 mb-4 text-4xl tracking-tight sm:text-5xl">
            Encontre quem combina com você.
          </h1>
          <p className="max-w-xl text-sm leading-7 text-zinc-500">
            Explore todos os espaços do Flow. Escolha seu serviço, sua cidade e
            o seu jeito de ser atendido.
          </p>
        </div>
        <Suspense
          fallback={
            <p className="py-12 text-sm text-zinc-500">
              Encontrando seus próximos momentos…
            </p>
          }
        >
          <BusinessDirectory businesses={businesses} />
        </Suspense>
      </Container>
      <Footer />
    </div>
  );
}
