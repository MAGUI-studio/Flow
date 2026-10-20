import { FavoritesProvider } from "@/components/favorites";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import type { Metadata } from "next";
import "./globals.css";
import "./internal.css";
import "leaflet/dist/leaflet.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { FlowToaster } from "@/components/ui/flow-toaster";
export const metadata: Metadata = {
  title: "Flow · Seu tempo, em boa companhia",
  description:
    "Encontre profissionais e agende seu próximo cuidado. Um produto MAGUI.studio.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <ClerkProvider
          dynamic
          afterSignOutUrl="/"
          localization={{
            ...ptBR,
            signIn: {
              ...ptBR.signIn,
              start: {
                ...ptBR.signIn?.start,
                subtitle:
                  "Entre com sua conta para continuar sua assinatura ou confirmar seu próximo agendamento.",
                subtitleCombined:
                  "Entre com sua conta para continuar sua assinatura ou confirmar seu próximo agendamento.",
              },
            },
          }}
          signInUrl="/entrar"
          signUpUrl="/criar-conta"
          signInFallbackRedirectUrl="/agendamentos"
          signUpFallbackRedirectUrl="/agendamentos"
          appearance={{
            variables: {
              colorPrimary: "#635BFF",
              borderRadius: "11px",
              colorForeground: "#18181B",
              colorInput: "#FFFFFF",
              colorRing: "#635BFF",
              colorBorder: "#e4e1ed",
              fontFamily: "'DM Sans', Arial, sans-serif",
            },
          }}
        >
          <NuqsAdapter>
            <FlowToaster />
            <FavoritesProvider>
              <div className="relative mx-auto w-full max-w-440 [&_h2]:font-bold [&_h3]:font-semibold">
                {children}
              </div>
            </FavoritesProvider>
          </NuqsAdapter>
        </ClerkProvider>
      </body>
    </html>
  );
}
