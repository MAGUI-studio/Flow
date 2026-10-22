import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/lib/admin-policy";

export async function GET() {
  try {
    const ownerId = await currentUser();
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(ownerId);
    const subscription = await prisma().subscription.findUnique({
      where: { ownerId },
      select: { status: true, paidUntil: true },
    });
    return Response.json(
      {
        superAdmin: isSuperAdmin(user),
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
