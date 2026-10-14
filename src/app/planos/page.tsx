import { Container } from "@/components/container";
import { auth } from "@clerk/nextjs/server";
import { Header } from "@/components/header";
import { Plans } from "@/components/plans";
import { prisma } from "@/lib/prisma";
export default async function Page() {
  const { userId } = await auth();
  const sub = userId
    ? await prisma().subscription.findUnique({ where: { ownerId: userId } })
    : null;
  return (
    <>
      <Header />
      <Container as="main" className="page-intro">
        <div className="section-heading">
          <div className="eyebrow">MAIS FLOW NO SEU NEGÓCIO</div>
          <h1>Sua agenda merece esse cuidado.</h1>
          <p>
            Uma assinatura mensal para organizar sua rotina. Agendar como
            consumidor é sempre gratuito.
          </p>
        </div>
        <Plans
          currentPlan={
            sub?.status === "active" && sub.paidUntil > new Date()
              ? sub.plan
              : null
          }
          development={
            process.env.NODE_ENV === "development" &&
            process.env.DEV_SUBSCRIPTIONS_ENABLED === "true"
          }
        />
      </Container>
    </>
  );
}
