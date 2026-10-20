import { notFound } from "next/navigation";
import { profile } from "@/lib/catalog";
import { Booking } from "@/components/booking";
import { auth } from "@clerk/nextjs/server";
import { upcomingBookings } from "@/lib/upcoming-bookings";
import { Footer } from "@/components/footer";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { pageMetadata, jsonLd } from "@/lib/seo";
import { appUrl } from "@/lib/app-url";
const getBusiness = cache(profile);
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) notFound();
  const location = business.online ? "Atendimento online" : business.city;
  return pageMetadata(
    `${business.name} — ${location}`,
    business.description ||
      `Conheça ${business.name}, consulte serviços e profissionais e agende seu horário ${business.online ? "online" : `em ${business.city}`}.`,
    `/${business.slug}`,
    false,
    business.coverUrl,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) notFound();
  const { userId } = await auth();
  const ownedBusiness = userId
    ? await prisma().establishment.findFirst({
        where: { id: business.id, ownerId: userId },
        select: { id: true },
      })
    : null;
  const reservations = userId
    ? await upcomingBookings(userId, business.id)
    : [];
  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": business.online ? "Organization" : "LocalBusiness",
            "@id": `${appUrl}/${business.slug}#business`,
            name: business.name,
            url: `${appUrl}/${business.slug}`,
            description: business.description,
            ...(business.coverUrl ? { image: business.coverUrl } : {}),
            ...(!business.online && business.address
              ? { address: business.address }
              : {}),
            ...(business.location
              ? {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: business.location.latitude,
                    longitude: business.location.longitude,
                  },
                }
              : {}),
          }),
        }}
      />
      <Booking
        business={business}
        myBookings={reservations}
        bookingsUserId={userId}
        ownerUserId={ownedBusiness ? userId : null}
      />
      <Footer />
    </div>
  );
}
