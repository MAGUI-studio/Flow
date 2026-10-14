import { Home } from "@/components/home";
import { catalog } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page() {
  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Home businesses={await catalog()} />
    </div>
  );
}
