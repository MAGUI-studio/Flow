import { notFound } from "next/navigation";
import { profile } from "@/lib/catalog";
import { Booking } from "@/components/booking";
import { auth } from "@clerk/nextjs/server";
import { upcomingBookings } from "@/lib/upcoming-bookings";
import { Footer } from "@/components/footer";
import { LocationMap } from "@/components/ui/location-map";
import { Container } from "@/components/container";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await profile(slug);
  if (!business) notFound();
  const { userId } = await auth();
  const reservations = userId
    ? await upcomingBookings(userId, business.id)
    : [];
  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Booking
        business={business}
        myBookings={reservations}
        bookingsUserId={userId}
      />
      {business.location && (
        <Container as="section" className="py-8">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">
            Onde encontrar a gente
          </h2>
          <p className="mb-5 text-sm text-zinc-500">
            {business.address} · {business.city}
          </p>
          <LocationMap point={business.location} />
          <a
            href={`https://www.openstreetmap.org/directions?to=${business.location.latitude}%2C${business.location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-[#635BFF]"
          >
            Traçar rota no OpenStreetMap
          </a>
        </Container>
      )}
      <Footer />
    </div>
  );
}
