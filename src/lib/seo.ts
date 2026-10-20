import type { Metadata } from "next";
import { appUrl } from "./app-url";
export const siteDescription =
  "Encontre serviços e profissionais perto de você ou online. Compare espaços, escolha seu horário e agende seu próximo cuidado com o Flow.";

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  privatePage = false,
  image?: string | null,
): Metadata {
  const fullTitle = `${title} | Flow`;
  const url = new URL(path, appUrl).toString();
  const images = [{ url: image || `${appUrl}/opengraph-image`, alt: title }];
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: privatePage ? null : url },
    robots: { index: !privatePage, follow: !privatePage },
    openGraph: {
      type: "website",
      siteName: "Flow",
      locale: "pt_BR",
      title: fullTitle,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images,
    },
  };
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
