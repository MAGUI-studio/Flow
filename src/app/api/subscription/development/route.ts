import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { developmentSubscriptionsEnabled } from "@/lib/development-subscriptions";
export async function POST(request: Request) {
  if (
    !developmentSubscriptionsEnabled(
      process.env.NODE_ENV,
      process.env.DEV_SUBSCRIPTIONS_ENABLED,
    )
  )
    return Response.json({ error: "Recurso indisponível." }, { status: 404 });
  try {
    const owner = await currentUser();
    const { plan } = await request.json();
    if (!["basic", "multi"].includes(plan)) throw new Error("INVALID_INPUT");
    await prisma().$transaction(async (tx) => {
      await tx.account.upsert({
        where: { id: owner },
        create: { id: owner },
        update: {},
      });
      await tx.$queryRaw`SELECT id FROM accounts WHERE id=${owner} FOR UPDATE`;
      if (
        plan === "basic" &&
        (await tx.establishment.count({ where: { ownerId: owner } })) > 1
      )
        throw new Error("DOWNGRADE_SELECTION_REQUIRED");
      if (plan === "basic") {
        const establishments = await tx.establishment.findMany({
          where: { ownerId: owner },
          include: {
            _count: { select: { professionals: { where: { active: true } } } },
          },
        });
        if (
          establishments.some((business) => business._count.professionals > 10)
        )
          throw new Error("PROFESSIONAL_DOWNGRADE_REQUIRED");
      }
      const current = await tx.subscription.findUnique({
        where: { ownerId: owner },
      });
      if (current?.stripeSubscriptionId) throw new Error("FORBIDDEN");
      const now = new Date(),
        until = new Date(now);
      until.setMonth(until.getMonth() + 1);
      await tx.subscription.upsert({
        where: { ownerId: owner },
        create: {
          ownerId: owner,
          plan,
          status: "active",
          provider: "development",
          currentPeriodStart: now,
          paidUntil: until,
        },
        update: {
          plan,
          status: "active",
          provider: "development",
          currentPeriodStart: now,
          paidUntil: until,
          cancelAtPeriodEnd: false,
        },
      });
    });
    return Response.json({ active: true });
  } catch (error) {
    return apiError(error);
  }
}
