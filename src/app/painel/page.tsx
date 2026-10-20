import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Visão geral do negócio",
  "Acompanhe seus agendamentos, equipe e serviços no painel do seu negócio.",
  "/painel",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return <PanelPage section="overview" searchParams={searchParams} />;
}
