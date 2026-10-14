import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Flow · Seu tempo, em boa companhia",
  description:
    "Encontre profissionais e agende seu próximo cuidado. Um produto MAGUI.studio.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <ClerkProvider
          localization={ptBR}
          signInUrl="/entrar"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/agendamentos"
          signUpFallbackRedirectUrl="/agendamentos"
          appearance={{
            variables: {
              colorPrimary: "#635BFF",
              borderRadius: "11px",
              colorForeground: "#18181B",
              colorInput: "#FFFFFF",
              colorRing:'#635BFF',
              colorBorder:'#e4e1ed',
              fontFamily: "'DM Sans', Arial, sans-serif",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
