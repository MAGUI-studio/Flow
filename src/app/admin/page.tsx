import { clerkClient } from "@clerk/nextjs/server";
import {
  requireAdminPage,
  adminName,
  adminEmail,
  adminDate,
} from "@/lib/admin";
import { adminEventLabel } from "@/lib/admin-labels";
import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/admin/dashboard";
export default async function Page() {
  await requireAdminPage();
  const db = prisma(),
    clerk = await clerkClient();
  const [
    users,
    accounts,
    businesses,
    subscriptions,
    bookings,
    overdue,
    recentUsers,
    recentEvents,
  ] = await Promise.all([
    clerk.users.getCount(),
    db.account.count(),
    db.establishment.count(),
    db.subscription.count({
      where: { status: "active", paidUntil: { gt: new Date() } },
    }),
    db.booking.count({ where: { purpose: "normal" } }),
    db.subscription.count({
      where: {
        OR: [
          { status: { in: ["past_due", "unpaid"] } },
          { status: "active", paidUntil: { lte: new Date() } },
        ],
      },
    }),
    clerk.users.getUserList({ limit: 5, orderBy: "-created_at" }),
    db.auditEvent.findMany({
      take: 5,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { establishment: { select: { name: true } } },
    }),
  ]);
  return (
    <AdminDashboard
      counts={[users, accounts, businesses, subscriptions, bookings, overdue]}
      recentUsers={recentUsers.data.map((u) => ({
        id: u.id,
        name: adminName(u),
        email: adminEmail(u),
        created: adminDate(u.createdAt),
      }))}
      recentEvents={recentEvents.map((e) => ({
        id: String(e.id),
        label: adminEventLabel(e.action),
        date: adminDate(e.createdAt),
        business: e.establishment?.name ?? "Plataforma Flow",
      }))}
    />
  );
}
