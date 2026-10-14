import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { createReview } from "@/lib/reviews";
import { revalidatePath } from "next/cache";
export async function POST(request: Request) {
  try {
    const userId = await currentUser();
    const input = await request.json();
    await prisma().$transaction((tx) => createReview(tx, userId, input));
    revalidatePath("/");
    revalidatePath("/explorar");
    revalidatePath("/[slug]", "page");
    revalidatePath("/agendamentos");
    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
