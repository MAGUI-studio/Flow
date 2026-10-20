import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Serviços do negócio",
  "Gerencie serviços, preços, duração e profissionais vinculados ao atendimento.",
  "/painel/servicos",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return <PanelPage section="services" searchParams={searchParams} />;
}
