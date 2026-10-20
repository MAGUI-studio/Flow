import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Minha assinatura",
  "Consulte seu plano, acompanhe limites e gerencie pagamentos e cancelamento.",
  "/painel/assinatura",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return <PanelPage section="subscription" searchParams={searchParams} />;
}
