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
