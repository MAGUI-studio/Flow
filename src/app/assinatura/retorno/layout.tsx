import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Confirmação da assinatura",
  "Acompanhe a confirmação da assinatura e continue para o painel do seu negócio.",
  "/assinatura/retorno",
  true,
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
