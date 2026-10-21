import { z } from "zod";
import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { getAvailability } from "@/lib/availability";
import { requestReschedule } from "@/lib/scheduling";
import { revalidatePath } from "next/cache";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await currentUser();
    const { id } = await params;
    const b = await prisma().booking.findUniqueOrThrow({
      where: { id },
      include: {
        session: {
          include: {
            establishment: true,
            service: {
              include: { professionals: { include: { professional: true } } },
            },
          },
        },
      },
    });
    if (b.consumerId !== actor && b.session.establishment.ownerId !== actor)
      throw Error("FORBIDDEN");
    const professionals = b.session.service.professionals
      .filter((p) => p.professional.active && !p.professional.deletedAt)
      .map((p) => ({ id: p.professionalId, name: p.professional.name }));
    const url = new URL(request.url);
    const professionalId =
      url.searchParams.get("professionalId") ?? b.session.professionalId;
    if (!professionals.some((p) => p.id === professionalId))
      throw Error("FORBIDDEN");
    const availability = await getAvailability(
      b.session.serviceId,
      professionalId,
      url.searchParams.get("date") ?? undefined,
      prisma(),
      b.consumerId,
      b.id,
    );
    return Response.json(
      { ...availability, professionals },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await currentUser();
    const { id } = await params;
    const raw = await request.json();
    const result = await prisma().$transaction(
      (tx) => requestReschedule(tx, actor, id, raw),
      { timeout: 20000 },
    );
    revalidatePath("/agendamentos");
    revalidatePath("/painel/agenda");
    return Response.json(result);
  } catch (error) {
    return apiError(
      error instanceof z.ZodError ? Error("INVALID_INPUT") : error,
    );
  }
}
