import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { catalog } from "@/lib/catalog";
import { PageHeading } from "@/components/internal/primitives";
import { BusinessListingCard } from "@/components/business-listing-card";
import { FavoriteList } from "@/components/favorites";
export default async function Page() {
  const { userId } = await auth.protect();
  const [saved, businesses] = await Promise.all([
    prisma().favorite.findMany({
      where: { accountId: userId },
      orderBy: { createdAt: "desc" },
      select: { establishmentId: true },
    }),
    catalog(),
  ]);
  const items = businesses.map((b) => ({
    id: b.id,
    node: <BusinessListingCard business={b} />,
  }));
  return (
    <>
      <PageHeading
        eyebrow="SEUS LUGARES"
        title="Meus favoritos"
        description="Os espaços que você quer ter sempre por perto. Encontre seu próximo cuidado por aqui."
      />
      <FavoriteList
        items={items}
        initialIds={saved.map((row) => row.establishmentId)}
      />
    </>
  );
}
