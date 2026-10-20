import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ownerId = await currentUser();
    const subscription = await prisma().subscription.findUnique({
      where: { ownerId },
      select: { status: true, paidUntil: true },
    });
    return Response.json(
      {
        businessAccess:
          subscription?.status === "active" &&
          subscription.paidUntil > new Date(),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
