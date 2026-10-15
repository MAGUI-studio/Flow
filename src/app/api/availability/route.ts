import { getAvailability } from "@/lib/availability";
import { apiError } from "@/lib/access";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams;
    const { userId } = await auth();
    return Response.json(
      await getAvailability(
        p.get("serviceId") ?? "",
        p.get("professionalId") ?? "",
        p.get("date") ?? undefined,
        prisma(),
        userId ?? undefined,
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
