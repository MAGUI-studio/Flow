import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "./prisma";
import { loadPanelSearch, type SearchInput } from "./url-state";
import { completeOverdueBookings } from "./booking-completion";
export const ownerContext = cache(async () => {
  const { userId } = await auth.protect();
  const subscription = await prisma().subscription.findUnique({
    where: { ownerId: userId },
  });
  if (
    !subscription ||
    subscription.status !== "active" ||
    subscription.paidUntil <= new Date()
  )
    redirect("/#planos");
  await completeOverdueBookings(prisma(), new Date(), { ownerId: userId });
  const businesses = await prisma().establishment.findMany({
    where: { ownerId: userId, active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      city: true,
      description: true,
      color: true,
      timezone: true,
      approvalMode: true,
      cancelNoticeHours: true,
    },
  });
  return { userId, subscription, businesses };
});
export async function panelContext(searchParams: SearchInput) {
  const owner = await ownerContext();
  const query = await loadPanelSearch(searchParams);
  const business = query.estabelecimento
    ? owner.businesses.find((b) => b.id === query.estabelecimento)
    : owner.businesses[0];
  if (query.estabelecimento && !business) notFound();
  return { ...owner, query, business };
}
