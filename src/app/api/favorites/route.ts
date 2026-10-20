import { setFavorite } from "@/lib/favorites";
import { z } from "zod";
import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
export async function GET() {
  try {
    const accountId = await currentUser();
    const rows = await prisma().favorite.findMany({
      where: { accountId },
      select: { establishmentId: true },
    });
    return Response.json({ ids: rows.map((row) => row.establishmentId) });
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(request: Request) {
  try {
    const accountId = await currentUser();
    const input = z
      .object({ establishmentId: z.string().uuid(), saved: z.boolean() })
      .safeParse(await request.json());
    if (!input.success) throw new Error("INVALID_INPUT");
    const { establishmentId, saved } = input.data;
    await prisma().$transaction((tx) =>
      setFavorite(tx, accountId, establishmentId, saved),
    );
    return Response.json({ saved });
  } catch (error) {
    return apiError(error);
  }
}
