import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Agenda do negócio",
  "Gerencie agendamentos, aprovações e atendimentos em tabela, agenda diária, calendário e cronograma.",
  "/painel/agenda",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return <PanelPage section="agenda" searchParams={searchParams} />;
}
