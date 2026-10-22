import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
