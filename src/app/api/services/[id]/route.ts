import { z } from "zod";
import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { editService } from "@/lib/service-management";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await currentUser();
    const id = z
      .string()
      .uuid()
      .parse((await context.params).id);
    const input = await request.json();
    const service = await prisma().$transaction((tx) =>
      editService(tx, owner, id, input),
    );
    return Response.json({ id: service.id });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SERVICE_PROFESSIONAL_HAS_SESSIONS"
    )
      return Response.json(
        {
          error:
            "Este profissional tem atendimentos vinculados ao serviço. Mantenha o vínculo para preservar a agenda e o histórico.",
        },
        { status: 409 },
      );
    return apiError(error);
  }
}
