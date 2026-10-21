import { z } from "zod";
import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { owned } from "@/lib/business-write";
import {
  createBlock,
  createSeries,
  decideReschedule,
  saveCustomerNote,
  replaceSeries,
} from "@/lib/scheduling";
import { releaseBooking } from "@/lib/reservations";
import { revalidatePath } from "next/cache";
const command = z.discriminatedUnion("action", [
  z.object({ action: z.literal("block"), values: z.unknown() }),
  z.object({ action: z.literal("unblock"), id: z.string().uuid() }),
  z.object({
    action: z.literal("note"),
    id: z.string().uuid().optional(),
    values: z.unknown(),
  }),
  z.object({
    action: z.literal("rescheduleDecision"),
    id: z.string().uuid(),
    approve: z.boolean(),
  }),
  z.object({
    action: z.literal("series"),
    preview: z.boolean(),
    values: z.unknown(),
  }),
  z.object({
    action: z.literal("replaceSeries"),
    preview: z.boolean(),
    id: z.string().uuid(),
    fromBookingId: z.string().uuid(),
    values: z.unknown(),
  }),
  z.object({
    action: z.literal("cancelSeries"),
    id: z.string().uuid(),
    fromBookingId: z.string().uuid(),
  }),
]);
export async function POST(request: Request) {
  try {
    const actor = await currentUser();
    const input = command.parse(await request.json());
    const result = await prisma().$transaction(
      async (tx) => {
        if (input.action === "block")
          return createBlock(tx, actor, input.values);
        if (input.action === "note")
          return saveCustomerNote(tx, actor, input.values, input.id);
        if (input.action === "series")
          return createSeries(tx, actor, input.values, input.preview);
        if (input.action === "replaceSeries")
          return replaceSeries(
            tx,
            actor,
            input.id,
            input.fromBookingId,
            input.values,
            input.preview,
          );
        if (input.action === "rescheduleDecision")
          return decideReschedule(tx, actor, input.id, input.approve);
        if (input.action === "unblock") {
          const b = await tx.scheduleBlock.findUniqueOrThrow({
            where: { id: input.id },
          });
          await owned(tx, actor, b.establishmentId);
          return tx.scheduleBlock.delete({ where: { id: b.id } });
        }
        const series = await tx.bookingSeries.findUniqueOrThrow({
          where: { id: input.id },
        });
        await owned(tx, actor, series.establishmentId);
        const from = await tx.booking.findFirst({
          where: { id: input.fromBookingId, seriesId: series.id },
        });
        if (!from) throw Error("FORBIDDEN");
        const start = await tx.session.findUniqueOrThrow({
          where: { id: from.sessionId },
        });
        const rows = await tx.booking.findMany({
          where: {
            seriesId: series.id,
            status: { in: ["confirmed", "pending"] },
            session: { startsAt: { gte: start.startsAt, gt: new Date() } },
          },
        });
        for (const b of rows) await releaseBooking(tx, b.id);
        return { count: rows.length };
      },
      { timeout: 30000 },
    );
    revalidatePath("/painel", "layout");
    revalidatePath("/agendamentos");
    return Response.json(result ?? { updated: true });
  } catch (error) {
    return apiError(
      error instanceof z.ZodError ? Error("INVALID_INPUT") : error,
    );
  }
}
