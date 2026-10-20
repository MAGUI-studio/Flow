import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Agende serviços e encontre profissionais",
  "Encontre serviços de beleza, bem-estar, saúde e muito mais. Escolha um espaço, compare profissionais e agende seu horário online.",
  "/",
  false,
);
import { Home } from "@/components/home";
import { catalog, profile } from "@/lib/catalog";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { jsonLd } from "@/lib/seo";
import { appUrl } from "@/lib/app-url";
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
        business!.services.filter((service) => service.priceCents > 0).length >=
          4 &&
        business!.services.some(
          (service) =>
            service.priceCents > 0 && service.professionalIds.length >= 2,
        ),
    ) ??
    automatic.find((business) =>
      business!.services.some((service) => service.priceCents > 0),
    ) ??
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Flow",
            url: appUrl,
            inLanguage: "pt-BR",
            description: "Encontre profissionais e agende seu próximo cuidado.",
          }),
        }}
      />
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
