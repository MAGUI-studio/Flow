import { z } from "zod";
import { currentUser, apiError } from "@/lib/access";
import { paidAccount } from "@/lib/business-write";
import { setupState } from "@/lib/business-setup";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
const schema = z.object({ id: z.string().uuid(), published: z.boolean() });
export async function POST(request: Request) {
  try {
    const ownerId = await currentUser();
    const input = schema.safeParse(await request.json());
    if (!input.success) throw Error("INVALID_INPUT");
    await prisma().$transaction(async (tx) => {
      await paidAccount(tx, ownerId);
      await tx.$queryRaw`SELECT id FROM establishments WHERE id=${input.data.id}::uuid FOR UPDATE`;
      const state = await setupState(tx, input.data.id, ownerId);
      if (input.data.published && !state.ready) throw Error("SETUP_INCOMPLETE");
      await tx.establishment.update({
        where: { id: state.business.id },
        data: { published: input.data.published },
      });
      await tx.auditEvent.create({
        data: {
          actorId: ownerId,
          establishmentId: state.business.id,
          action: input.data.published
            ? "business.published"
            : "business.unpublished",
        },
      });
    });
    revalidatePath("/");
    revalidatePath("/explorar");
    revalidatePath("/painel");
    revalidatePath("/painel/configuracao");
    return Response.json({ updated: true });
  } catch (e) {
    return apiError(e, "business.publish");
  }
}
