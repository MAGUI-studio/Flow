import { Home } from "@/components/home";
import { catalog, profile } from "@/lib/catalog";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function Page() {
  const businesses = await catalog();
  const { userId } = await auth();
  const subscription = userId
    ? await prisma().subscription.findUnique({ where: { ownerId: userId } })
    : null;
  const currentPlan =
    subscription?.status === "active" &&
    subscription.paidUntil > new Date() &&
    (subscription.provider === "stripe" ||
      process.env.DEV_SUBSCRIPTIONS_ENABLED === "true")
      ? subscription.plan
      : null;
  const candidates = await Promise.all(
    businesses
      .filter((business) => business.serviceNames.length > 0)
      .map((business) => profile(business.slug)),
  );
  const automatic = candidates.filter(
    (business) => business?.approvalMode === "automatic",
  );
  const previewBusiness =
    automatic.find(
      (business) =>
        business!.services.length >= 3 &&
        business!.services.some(
          (service) => service.professionalIds.length >= 2,
        ),
    ) ??
    automatic[0] ??
    null;
  const managementBusiness =
    candidates.find(
      (business) =>
        business?.approvalMode === "manual" &&
        business.services.length > 0 &&
        business.professionals.length >= 2,
    ) ?? previewBusiness;
  return (
    <div id="inicio" className="mx-auto w-full max-w-[1200px] overflow-x-clip">
      <Home
        businesses={businesses}
        previewBusiness={previewBusiness}
        managementBusiness={managementBusiness}
        currentPlan={currentPlan}
        development={
          process.env.NODE_ENV === "development" &&
          process.env.DEV_SUBSCRIPTIONS_ENABLED === "true"
        }
      />
    </div>
  );
}
