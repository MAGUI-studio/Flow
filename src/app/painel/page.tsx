import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { Manager, type ManagedBusiness } from "@/components/manager";
export default async function Page() {
  const { userId } = await auth.protect();
  const subscription = await prisma().subscription.findUnique({
    where: { ownerId: userId },
  });
  if (
    !subscription ||
    subscription.status !== "active" ||
    subscription.paidUntil <= new Date()
  )
    redirect("/planos");
  const rows = await prisma().establishment.findMany({
    where: { ownerId: userId, active: true },
    include: {
      professionals: { where: { active: true } },
      services: { where: { active: true }, include: { professionals: true } },
      sessions: {
        include: { service: true, professional: true, bookings: true },
        orderBy: { startsAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  const businesses: ManagedBusiness[] = await Promise.all(
    rows.map(async (e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      timezone: e.timezone,
      professionals: e.professionals.map((p) => ({ id: p.id, name: p.name })),
      services: e.services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        priceCents: s.priceCents,
        kind: s.kind,
        professionals: s.professionals.map((p) => ({
          professionalId: p.professionalId,
        })),
      })),
      windows: (
        await prisma().availabilityWindow.findMany({
          where: {
            professional: { establishmentId: e.id },
            endsAt: { gt: new Date() },
          },
          orderBy: { startsAt: "asc" },
          take: 100,
        })
      ).map((w) => ({
        id: w.id,
        professionalId: w.professionalId,
        startsAt: w.startsAt.toISOString(),
        endsAt: w.endsAt.toISOString(),
      })),
      bookings: e.sessions.flatMap((s) =>
        s.bookings.map((b) => ({
          id: b.id,
          status:
            b.status === "pending" && b.expiresAt && b.expiresAt <= new Date()
              ? "expired"
              : b.status,
          startsAt: s.startsAt.toISOString(),
          serviceName: s.service.name,
          professionalName: s.professional.name,
          whatsapp: b.whatsapp,
        })),
      ),
    })),
  );
  return (
    <>
      <Header />
      <main className="wrap">
        <Manager businesses={businesses} plan={subscription.plan} />
      </main>
    </>
  );
}
