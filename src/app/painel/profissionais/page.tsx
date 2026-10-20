import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Profissionais do negócio",
  "Consulte sua equipe, filtre serviços vinculados e organize os horários dos profissionais.",
  "/painel/profissionais",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return <PanelPage section="professionals" searchParams={searchParams} />;
}
