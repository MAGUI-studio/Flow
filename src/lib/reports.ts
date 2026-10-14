import { prisma } from "./prisma";
import { planFeatures } from "./plan-features";
import type { ReportRow } from "./report-utils";
export async function reportRows(
  ownerId: string,
  establishmentId: string | null,
  days: number,
): Promise<ReportRow[]> {
  const sub = await prisma().subscription.findUnique({ where: { ownerId } });
  if (
    !sub ||
    sub.status !== "active" ||
    sub.paidUntil <= new Date() ||
    !planFeatures(sub.plan).reports
  )
    throw new Error("FORBIDDEN");
  if (
    establishmentId &&
    !(await prisma().establishment.findFirst({
      where: { id: establishmentId, ownerId, active: true },
      select: { id: true },
    }))
  )
    throw new Error("FORBIDDEN");
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const rows = await prisma().booking.findMany({
    where: {
      session: {
        startsAt: { gte: start, lte: end },
        establishment: {
          ownerId,
          active: true,
          ...(establishmentId ? { id: establishmentId } : {}),
        },
      },
    },
    include: {
      session: {
        include: { service: true, professional: true, establishment: true },
      },
    },
    orderBy: { session: { startsAt: "desc" } },
  });
  return rows.map((row) => ({
    id: row.id,
    status:
      row.status === "pending" && row.expiresAt && row.expiresAt <= end
        ? "expired"
        : row.status,
    priceCents: row.priceCents,
    startsAt: row.session.startsAt,
    service: row.session.service.name,
    professional: row.session.professional.name,
    establishment: row.session.establishment.name,
    timezone: row.session.establishment.timezone,
  }));
}
