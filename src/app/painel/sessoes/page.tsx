import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Sessões em grupo",
  "Organize turmas, vagas e horários dos atendimentos em grupo.",
  "/painel/sessoes",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return <PanelPage section="sessions" searchParams={searchParams} />;
}
