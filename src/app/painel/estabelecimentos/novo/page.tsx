import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Criar estabelecimento",
  "Cadastre seu estabelecimento, adicione contatos e apresente seu espaço aos clientes.",
  "/painel/estabelecimentos/novo",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return (
    <PanelPage
      section="establishments"
      form="establishment"
      searchParams={searchParams}
    />
  );
}
