import { z } from "zod";
import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { bookingReminders, readNotifications } from "@/lib/notifications";
import { completeOverdueBookings } from "@/lib/booking-completion";
export async function GET() {
  try {
    const accountId = await currentUser();
    const db = prisma();
    await completeOverdueBookings(db, new Date(), { consumerId: accountId });
    await bookingReminders(db, accountId);
    const [items, unread] = await Promise.all([
      db.notification.findMany({
        where: { accountId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 50,
        select: {
          id: true,
          title: true,
          body: true,
          href: true,
          readAt: true,
          createdAt: true,
        },
      }),
      db.notification.count({ where: { accountId, readAt: null } }),
    ]);
    return Response.json(
      { items, unread },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error, "notifications.list");
  }
}
const schema = z.object({ ids: z.array(z.string().uuid()).max(50).optional() });
export async function PATCH(request: Request) {
  try {
    const accountId = await currentUser();
    const input = schema.safeParse(await request.json());
    if (!input.success) throw Error("INVALID_INPUT");
    await readNotifications(prisma(), accountId, input.data.ids);
    return Response.json({ updated: true });
  } catch (error) {
    return apiError(error, "notifications.read");
  }
}
