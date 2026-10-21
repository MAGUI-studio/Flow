import { z } from "zod";
import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { joinWaitlist, decideWaitlist } from "@/lib/waitlist";
import { revalidatePath } from "next/cache";
export async function POST(request: Request) {
  try {
    const actor = await currentUser();
    const raw = await request.json();
    await prisma().$transaction(async (tx) => {
      await tx.account.upsert({
        where: { id: actor },
        create: { id: actor },
        update: {},
      });
      await joinWaitlist(tx, actor, raw);
    });
    revalidatePath("/lista-de-espera");
    return Response.json({ created: true });
  } catch (error) {
    return apiError(
      error instanceof z.ZodError ? Error("INVALID_INPUT") : error,
    );
  }
}
export async function PATCH(request: Request) {
  try {
    const actor = await currentUser();
    const raw = z
      .object({ id: z.string().uuid(), accept: z.boolean() })
      .parse(await request.json());
    await prisma().$transaction((tx) =>
      decideWaitlist(tx, actor, raw.id, raw.accept),
    );
    revalidatePath("/lista-de-espera");
    revalidatePath("/agendamentos");
    return Response.json({ updated: true });
  } catch (error) {
    return apiError(
      error instanceof z.ZodError ? Error("INVALID_INPUT") : error,
    );
  }
}
