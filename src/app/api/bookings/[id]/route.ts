import { markBookingArrival } from "@/lib/booking-arrival";
import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { releaseBooking } from "@/lib/reservations";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await currentUser();
    const { id } = await params;
    const { action } = await request.json();
    await prisma().$transaction(async (tx) => {
      const first = await tx.booking.findUnique({
        where: { id },
        include: {
          session: {
            include: {
              establishment: {
                include: { owner: { include: { subscription: true } } },
              },
              service: true,
            },
          },
        },
      });
      if (!first) throw new Error("SESSION_NOT_FOUND");
      const s = first.session;
      await tx.$queryRaw`SELECT id FROM establishments WHERE id=${s.establishmentId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM professionals WHERE id=${s.professionalId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM sessions WHERE id=${s.id}::uuid FOR UPDATE`;
      const booking = await tx.booking.findUniqueOrThrow({ where: { id } });
      if (booking.purpose !== "normal") throw Error("BOOKING_CLOSED");
      const now = new Date();
      const owner = actor === s.establishment.ownerId;
      const sub = await tx.subscription.findUnique({
        where: { ownerId: s.establishment.ownerId },
      });
      if (owner && (!sub || sub.status !== "active" || sub.paidUntil <= now))
        throw new Error("FORBIDDEN");
      if (!owner && (booking.consumerId !== actor || action !== "cancel"))
        throw new Error("FORBIDDEN");
      if (action === "arrive") {
        await markBookingArrival(tx, actor, id);
        return;
      }
      if (
        !["pending", "confirmed"].includes(booking.status) ||
        (booking.status === "pending" && booking.expiresAt! <= now)
      )
        throw new Error("BOOKING_CLOSED");
      if (
        !owner &&
        s.startsAt.getTime() - now.getTime() <
          s.establishment.cancelNoticeHours * 3600000
      )
        throw new Error("CANCELLATION_DEADLINE");
      let status = "";
      if (action === "cancel") status = "canceled";
      else if (
        action === "approve" &&
        booking.status === "pending" &&
        s.startsAt > now
      )
        status = "confirmed";
      else if (action === "decline" && booking.status === "pending")
        status = "declined";
      else if (
        action === "complete" &&
        booking.status === "confirmed" &&
        s.startsAt <= now
      )
        status = "completed";
      else throw new Error("INVALID_INPUT");
      if (status === "canceled") await releaseBooking(tx, id);
      else await tx.booking.update({ where: { id }, data: { status } });
      await tx.auditEvent.create({
        data: {
          actorId: actor,
          establishmentId: s.establishmentId,
          bookingId: id,
          action: "booking." + status,
        },
      });
      if (
        s.service.kind === "individual" &&
        !(await tx.booking.count({
          where: { sessionId: s.id, status: { in: ["pending", "confirmed"] } },
        }))
      )
        await tx.session.update({
          where: { id: s.id },
          data: { active: false },
        });
    });
    revalidatePath("/agendamentos");
    revalidatePath("/painel/agenda");
    return Response.json({ updated: true });
  } catch (error) {
    return apiError(error);
  }
}
