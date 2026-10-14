import { prisma } from "./prisma";
import type { Prisma } from "@/generated/prisma/client";
export type UpcomingBooking = {
  id: string;
  status: string;
  startsAt: string;
  serviceName: string;
  professionalName: string;
};
export async function upcomingBookings(
  consumerId: string,
  establishmentId: string,
  tx: Prisma.TransactionClient = prisma(),
): Promise<UpcomingBooking[]> {
  const now = new Date();
  const rows = await tx.booking.findMany({
    where: {
      consumerId,
      session: { establishmentId, startsAt: { gt: now } },
      OR: [
        { status: "confirmed" },
        { status: "pending", expiresAt: { gt: now } },
      ],
    },
    orderBy: { session: { startsAt: "asc" } },
    select: {
      id: true,
      status: true,
      session: {
        select: {
          startsAt: true,
          service: { select: { name: true } },
          professional: { select: { name: true } },
        },
      },
    },
  });
  return rows.map((b) => ({
    id: b.id,
    status: b.status,
    startsAt: b.session.startsAt.toISOString(),
    serviceName: b.session.service.name,
    professionalName: b.session.professional.name,
  }));
}
