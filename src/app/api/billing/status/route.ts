import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ownerId = await currentUser();
    const sub = await prisma().subscription.findUnique({ where: { ownerId } });
    const business = await prisma().establishment.findFirst({
      where: { ownerId, active: true },
      select: { published: true },
      orderBy: { name: "asc" },
    });
    return Response.json(
      {
        plan: sub?.plan ?? null,
        nextUrl: business?.published ? "/painel" : "/painel/configuracao",
        active:
          sub?.provider === "stripe" &&
          sub.status === "active" &&
          sub.paidUntil > new Date(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
