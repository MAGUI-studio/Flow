import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Meus estabelecimentos",
  "Gerencie os estabelecimentos, contatos, imagens e páginas do seu negócio.",
  "/painel/estabelecimentos",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return <PanelPage section="establishments" searchParams={searchParams} />;
}
