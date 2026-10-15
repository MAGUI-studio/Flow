import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { InternalShell } from "@/components/internal/shell";
import { prisma } from "@/lib/prisma";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth.protect();
  const subscription = await prisma().subscription.findUnique({
    where: { ownerId: userId },
  });
  const plan =
    subscription?.status === "active" && subscription.paidUntil > new Date()
      ? subscription.plan
      : undefined;
  return (
    <Suspense
      fallback={
        <div className="internal-loading">Carregando seus agendamentos…</div>
      }
    >
      <InternalShell mode="consumer" plan={plan}>{children}</InternalShell>
    </Suspense>
  );
}
