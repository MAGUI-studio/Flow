import type { Prisma } from "@/generated/prisma/client";
export async function setFavorite(
  tx: Prisma.TransactionClient,
  accountId: string,
  establishmentId: string,
  saved: boolean,
) {
  if (!saved) {
    await tx.favorite.deleteMany({ where: { accountId, establishmentId } });
    return;
  }
  const business = await tx.establishment.findFirst({
    where: {
      id: establishmentId,
      active: true,
      published: true,
      owner: {
        subscription: {
          is: { status: "active", paidUntil: { gt: new Date() } },
        },
      },
    },
    select: { id: true },
  });
  if (!business) throw new Error("FORBIDDEN");
  await tx.account.upsert({
    where: { id: accountId },
    create: { id: accountId },
    update: {},
  });
  await tx.favorite.upsert({
    where: { accountId_establishmentId: { accountId, establishmentId } },
    create: { accountId, establishmentId },
    update: {},
  });
}
