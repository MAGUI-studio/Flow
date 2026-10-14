import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { InternalShell } from "@/components/internal/shell";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();
  return (
    <Suspense
      fallback={
        <div className="internal-loading">Carregando seus agendamentos…</div>
      }
    >
      <InternalShell mode="consumer">{children}</InternalShell>
    </Suspense>
  );
}
