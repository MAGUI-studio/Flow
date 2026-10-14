import { notFound } from "next/navigation";
import { profile } from "@/lib/catalog";
import { Booking } from "@/components/booking";
import { auth } from "@clerk/nextjs/server";
import { upcomingBookings } from "@/lib/upcoming-bookings";
import { Footer } from "@/components/footer";
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
      <Footer />
    </div>
  );
}
