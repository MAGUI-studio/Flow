import { z } from "zod";
import { currentUser, apiError } from "@/lib/access";
import { owned } from "@/lib/business-write";
import { weeklyScheduleSchema } from "@/lib/weekly-schedule";
import { prisma } from "@/lib/prisma";
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await currentUser();
    const professionalId = z
      .string()
      .uuid()
      .parse((await context.params).id);
    const input = await request.json();
    const establishmentId = z.string().uuid().parse(input.establishmentId);
    const schedule = weeklyScheduleSchema.parse(input);
    const result = await prisma().$transaction(async (tx) => {
      await owned(tx, owner, establishmentId);
      const professional = await tx.professional.findFirst({
        where: { id: professionalId, establishmentId, deletedAt: null },
      });
      if (!professional) throw new Error("INVALID_INPUT");
      return tx.professional.update({
        where: { id: professionalId },
        data: { weeklySchedule: schedule },
      });
    });
    return Response.json({ id: result.id });
  } catch (error) {
    return apiError(error);
  }
}
