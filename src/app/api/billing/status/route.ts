import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ownerId = await currentUser();
    const sub = await prisma().subscription.findUnique({ where: { ownerId } });
    return Response.json(
      {
        plan: sub?.plan ?? null,
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
