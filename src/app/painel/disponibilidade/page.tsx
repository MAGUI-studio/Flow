import { PanelPage } from "@/components/internal/panel-page";
import type { SearchInput } from "@/lib/url-state";
export default function Page({ searchParams }: { searchParams: SearchInput }) {
  return <PanelPage section="availability" searchParams={searchParams} />;
}
