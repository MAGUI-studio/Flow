import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/app-url";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const businesses = await prisma().establishment.findMany({
    where: {
      active: true,
      owner: {
        subscription: {
          is: { status: "active", paidUntil: { gt: new Date() } },
        },
      },
    },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  return ["/", "/explorar", ...businesses.map((b) => `/${b.slug}`)].map(
    (path) => ({ url: new URL(path, appUrl).toString() }),
  );
}
