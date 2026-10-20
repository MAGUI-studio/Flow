import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Criar sessão em grupo",
  "Defina data, horário, capacidade e profissional para uma nova sessão em grupo.",
  "/painel/sessoes/nova",
  true,
);
import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return (
    <PanelPage section="sessions" form="session" searchParams={searchParams} />
  );
}
