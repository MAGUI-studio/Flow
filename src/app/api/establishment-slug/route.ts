import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { businessSlug } from "@/lib/business-slug";
import { establishmentSchema } from "@/lib/form-schemas";
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Entre na sua conta." }, { status: 401 });
  const p = new URL(request.url).searchParams;
  const name = p.get("name") ?? "";
  const slug = p.get("slug") ?? "";
  if (
    !name.trim() ||
    name.length > 150 ||
    !establishmentSchema.shape.slug.safeParse(slug).success
  )
    return Response.json(
      { error: "Use letras minúsculas, números e hífens." },
      { status: 400 },
    );
  const automatic = businessSlug(name);
  const rows = await prisma().establishment.findMany({
    where: { slug: { in: [automatic, slug] } },
    select: { slug: true },
  });
  return Response.json(
    {
      canEdit: rows.some((row) => row.slug === automatic),
      available: !rows.some((row) => row.slug === slug),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
