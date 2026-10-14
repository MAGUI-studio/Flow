import { Suspense } from "react";
import { InternalShell } from "@/components/internal/shell";
import { ownerContext } from "@/lib/panel-context";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { businesses, subscription } = await ownerContext();
  return (
    <Suspense
      fallback={<div className="internal-loading">Organizando seu espaço…</div>}
    >
      <InternalShell
        mode="business"
        businesses={businesses}
        plan={subscription.plan}
      >
        {children}
      </InternalShell>
    </Suspense>
  );
}
