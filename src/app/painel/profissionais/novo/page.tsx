import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Adicionar profissional",
  "Cadastre um profissional, escolha sua foto e configure a disponibilidade de atendimento.",
  "/painel/profissionais/novo",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return (
    <PanelPage
      section="professionals"
      form="professional"
      searchParams={searchParams}
    />
  );
}
