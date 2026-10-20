import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { getAvailability } from "@/lib/availability";
import { dayKey } from "@/lib/format";
import { text } from "@/lib/business-write";
import { isEstablishmentOwner } from "@/lib/booking-policy";
export async function POST(request: Request) {
  try {
    const consumer = await currentUser();
    const body = await request.json();
    if (!body || !/^[0-9a-f-]{36}$/i.test(body.idempotencyKey ?? ""))
      throw new Error("INVALID_INPUT");
    const result = await prisma().$transaction(async (tx) => {
      await tx.account.upsert({
        where: { id: consumer },
        create: { id: consumer },
        update: {},
      });
      await tx.$queryRaw`SELECT id FROM accounts WHERE id=${consumer} FOR UPDATE`;
      const service = await tx.service.findUnique({
        where: { id: text(body.serviceId) },
        include: { establishment: true },
      });
      if (!service) throw new Error("SERVICE_UNAVAILABLE");
      if (isEstablishmentOwner(consumer, service.establishment.ownerId))
        throw new Error("OWN_ESTABLISHMENT_BOOKING");
      const professionalId = text(body.professionalId);
      await tx.$queryRaw`SELECT id FROM establishments WHERE id=${service.establishmentId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM professionals WHERE id=${professionalId}::uuid FOR UPDATE`;
      const previous = await tx.booking.findUnique({
        where: {
          consumerId_idempotencyKey: {
            consumerId: consumer,
            idempotencyKey: body.idempotencyKey,
          },
        },
        include: { session: true },
      });
      if (previous) {
        if (
          previous.session.serviceId !== service.id ||
          previous.session.professionalId !== professionalId ||
          previous.session.startsAt.toISOString() !== body.startsAt
        )
          throw new Error("IDEMPOTENCY_CONFLICT");
        return { id: previous.id, status: previous.status };
      }
      const start = new Date(body.startsAt);
      if (!Number.isFinite(start.getTime())) throw new Error("INVALID_INPUT");
      const availability = await getAvailability(
        service.id,
        professionalId,
        dayKey(start, service.establishment.timezone),
        tx,
        consumer,
      );
      const slot = availability.slots.find(
        (s) => s.startsAt === start.toISOString(),
      );
      if (!slot) throw new Error("SESSION_UNAVAILABLE");
      let sessionId = slot.sessionId;
      if (!sessionId) {
        await tx.booking.updateMany({
          where: {
            status: "pending",
            expiresAt: { lte: new Date() },
            session: { professionalId },
          },
          data: { status: "expired" },
        });
        await tx.session.updateMany({
          where: {
            professionalId,
            active: true,
            service: { kind: "individual" },
            bookings: { none: { status: { in: ["pending", "confirmed"] } } },
          },
          data: { active: false },
        });
        const end = new Date(start.getTime() + service.durationMinutes * 60000);
        const session = await tx.session.create({
          data: {
            establishmentId: service.establishmentId,
            serviceId: service.id,
            professionalId,
            startsAt: start,
            endsAt: end,
            occupiedStart: new Date(
              start.getTime() - service.bufferBefore * 60000,
            ),
            occupiedEnd: new Date(end.getTime() + service.bufferAfter * 60000),
            capacity: 1,
          },
        });
        sessionId = session.id;
      }
      let whatsapp =
        typeof body.whatsapp === "string"
          ? body.whatsapp.replace(/[^0-9+]/g, "")
          : null;
      if (whatsapp && !whatsapp.startsWith("+")) whatsapp = `+55${whatsapp}`;
      const result = await tx.$queryRaw<
        { id: string }[]
      >`SELECT reserve_session(${sessionId}::uuid,${consumer}::text,${whatsapp}::text,${body.idempotencyKey}::uuid) AS id`;
      return tx.booking.findUniqueOrThrow({
        where: { id: result[0].id },
        select: { id: true, status: true },
      });
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
export async function GET() {
  try {
    const user = await currentUser();
    return Response.json(
      await prisma().booking.findMany({
        where: { consumerId: user },
        include: {
          session: {
            include: { establishment: true, service: true, professional: true },
          },
        },
        orderBy: { session: { startsAt: "desc" } },
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
