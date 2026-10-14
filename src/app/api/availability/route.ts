import { getAvailability } from "@/lib/availability";
import { apiError } from "@/lib/access";
export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams;
    return Response.json(
      await getAvailability(
        p.get("serviceId") ?? "",
        p.get("professionalId") ?? "",
        p.get("date") ?? undefined,
      ),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
