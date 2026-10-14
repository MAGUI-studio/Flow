import { Home } from "@/components/home";
import { catalog } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page() {
  return <Home businesses={await catalog()} />;
}
