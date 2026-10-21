import { Prisma } from "@/generated/prisma/client";
export async function bookingReminders(
  tx: Prisma.TransactionClient,
  accountId?: string,
) {
  // Idempotent catch-up: the cron and notification drawer may run concurrently.
  await tx.$executeRaw(Prisma.sql`
 INSERT INTO notifications(account_id,event_key,title,body,href)
 SELECT b.consumer_id,'reminder:'||b.id,'Seu atendimento está chegando',
 v.name||' em '||e.name||' · '||to_char(s.starts_at AT TIME ZONE e.timezone,'DD/MM às HH24:MI'),'/agendamentos?periodo=upcoming'
 FROM bookings b JOIN sessions s ON s.id=b.session_id JOIN services v ON v.id=s.service_id JOIN establishments e ON e.id=s.establishment_id
 WHERE b.status='confirmed' AND s.starts_at>now() AND s.starts_at<=now()+interval '24 hours'
 ${accountId ? Prisma.sql`AND b.consumer_id=${accountId}` : Prisma.empty}
 AND NOT EXISTS(SELECT 1 FROM notifications n WHERE n.event_key='reminder:'||b.id)
 ON CONFLICT(event_key) DO NOTHING`);
}
export async function readNotifications(
  tx: Prisma.TransactionClient,
  accountId: string,
  ids?: string[],
) {
  return tx.notification.updateMany({
    where: { accountId, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
}
