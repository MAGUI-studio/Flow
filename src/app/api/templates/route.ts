import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { owned } from "@/lib/business-write";
import { allowedTemplate } from "@/lib/plan-features";
import { templateSchema } from "@/lib/template-schema";
export async function POST(request: Request) {
  try {
    const owner = await currentUser();
    const result = templateSchema.safeParse(await request.json());
    if (!result.success) throw new Error("INVALID_INPUT");
    const input = result.data;
    await prisma().$transaction(async (tx) => {
      await owned(tx, owner, input.establishmentId);
      const sub = await tx.subscription.findUniqueOrThrow({
        where: { ownerId: owner },
      });
      if (!allowedTemplate(input.templateId, sub.plan))
        throw new Error("FORBIDDEN");
      await tx.establishment.update({
        where: { id: input.establishmentId },
        data: { templateId: input.templateId },
      });
    });
    return Response.json({ saved: true });
  } catch (error) {
    return apiError(error);
  }
}
