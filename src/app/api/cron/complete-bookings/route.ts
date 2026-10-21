import { bookingReminders } from "@/lib/notifications";
import { timingSafeEqual } from "node:crypto";
import { completeOverdueBookings } from "@/lib/booking-completion";
import { prisma } from "@/lib/prisma";
import { runScheduling } from "@/lib/scheduling-worker";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return Response.json({ error: "Cron não configurado." }, { status: 503 });
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  let completed = 0;
  for (let batch = 0; batch < 10; batch++) {
    const count = await completeOverdueBookings(prisma());
    completed += count;
    if (count < 500) break;
  }
  await bookingReminders(prisma());
  await runScheduling();
  return Response.json({ completed });
}
