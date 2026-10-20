import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Criar serviço",
  "Cadastre um serviço, defina preços e duração e selecione os profissionais que atendem.",
  "/painel/servicos/novo",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return (
    <PanelPage section="services" form="service" searchParams={searchParams} />
  );
}
