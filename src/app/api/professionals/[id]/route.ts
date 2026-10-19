import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  editProfessional,
  deleteProfessional,
} from "@/lib/professional-management";
function refreshProfessionalPages(slug: string) {
  revalidatePath("/painel", "layout");
  revalidatePath("/agendamentos");
  revalidatePath(`/${slug}`);
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await currentUser();
    const { id } = await params;
    const body = await request.json();
    if (!z.string().uuid().safeParse(id).success)
      throw new Error("INVALID_INPUT");
    const establishmentId = z.string().uuid().parse(body.establishmentId);
    const result = await prisma().$transaction((tx) =>
      editProfessional(tx, owner, establishmentId, id, body),
    );
    revalidatePath("/painel/profissionais");
    revalidatePath("/painel/agenda");
    revalidatePath("/agendamentos");
    revalidatePath(`/${result.slug}`);
    return Response.json(result.updated);
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiError(new Error("INVALID_INPUT"));
    return apiError(error);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await currentUser();
    const id = z
      .string()
      .uuid()
      .parse((await params).id);
    const { establishmentId } = z
      .object({ establishmentId: z.string().uuid() })
      .parse(await request.json());
    const slug = await prisma().$transaction((tx) =>
      deleteProfessional(tx, owner, establishmentId, id),
    );
    refreshProfessionalPages(slug);
    return Response.json({ deleted: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return apiError(new Error("INVALID_INPUT"));
    return apiError(error);
  }
}
