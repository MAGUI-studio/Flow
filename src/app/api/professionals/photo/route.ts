import { editProfessional } from "@/lib/professional-management";
import { professionalStatusSchema } from "@/lib/professional-status";
import { UTApi, UTFile } from "uploadthing/server";
import { z } from "zod";
import { currentUser, apiError } from "@/lib/access";
import { owned, createProfessional } from "@/lib/business-write";
import {
  professionalSchema,
  professionalCreationSchema,
} from "@/lib/form-schemas";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  photoMaxBytes,
  prepareProfessionalPhoto,
} from "@/lib/professional-photo";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const owner = await currentUser();
    if (Number(request.headers.get("content-length")) > photoMaxBytes + 65536)
      throw new Error("INVALID_PHOTO");
    const form = await request.formData();
    const establishmentId = z
      .string()
      .uuid()
      .parse(form.get("establishmentId"));
    const registration = form.has("name")
      ? professionalSchema.parse({ name: form.get("name") })
      : null;
    const editId = form.has("professionalId")
      ? z.string().uuid().parse(form.get("professionalId"))
      : null;
    const creation =
      registration && !editId
        ? professionalCreationSchema.parse({
            name: registration.name,
            days: JSON.parse(String(form.get("days") ?? "null")),
          })
        : null;
    const statusChange = editId
      ? professionalStatusSchema.parse({
          status: form.get("status"),
          start: form.get("start"),
          end: form.get("end"),
        })
      : null;
    const establishment = await prisma().$transaction((tx) =>
      owned(tx, owner, establishmentId),
    );
    const file = form.get("file");
    if (!(file instanceof File) || file.size > photoMaxBytes)
      throw new Error("INVALID_PHOTO");
    const recent = await prisma().professionalPhoto.count({
      where: {
        ownerId: owner,
        createdAt: { gte: new Date(Date.now() - 3600000) },
      },
    });
    if (recent >= 30)
      return Response.json(
        { error: "Você enviou muitas fotos. Tente novamente mais tarde." },
        { status: 429 },
      );
    const bytes = await prepareProfessionalPhoto(
      Buffer.from(await file.arrayBuffer()),
      file.type,
    );
    const ut = new UTApi();
    const uploaded = await ut.uploadFiles(
      new UTFile([new Uint8Array(bytes)], "profissional.webp", {
        type: "image/webp",
      }),
    );
    if (uploaded.error) throw new Error("UPLOAD_FAILED");
    try {
      const result = await prisma().$transaction(async (tx) => {
        await owned(tx, owner, establishmentId);
        const photo = await tx.professionalPhoto.create({
          data: {
            ownerId: owner,
            establishmentId,
            url: uploaded.data.ufsUrl,
            key: uploaded.data.key,
          },
          select: { id: true, url: true },
        });
        if (editId && registration && statusChange)
          return (
            await editProfessional(tx, owner, establishmentId, editId, {
              ...registration,
              ...statusChange,
              photoId: photo.id,
            })
          ).updated;
        if (registration)
          return createProfessional(tx, owner, {
            establishmentId,
            name: registration.name,
            days: creation?.days,
            photoId: photo.id,
          });
        return photo;
      });
      if (registration) {
        revalidatePath("/painel/profissionais");
        revalidatePath(`/${establishment.slug}`);
      }
      return Response.json(result);
    } catch (error) {
      await ut.deleteFiles(uploaded.data.key).catch(() => {});
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PHOTO")
      return Response.json(
        { error: "Escolha uma imagem PNG ou WEBP de até 1 MB." },
        { status: 400 },
      );
    if (error instanceof Error && error.message === "UPLOAD_FAILED")
      return Response.json(
        { error: "Não foi possível enviar a foto. Tente novamente." },
        { status: 502 },
      );
    if (error instanceof z.ZodError)
      return Response.json(
        {
          error:
            "Confira o nome do profissional e o estabelecimento informado.",
        },
        { status: 400 },
      );
    return apiError(error);
  }
}
