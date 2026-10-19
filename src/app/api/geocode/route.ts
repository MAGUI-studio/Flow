import { auth } from "@clerk/nextjs/server";
import { addressSchema } from "@/lib/address";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/app-url";
const recent = new Map<string, number>();
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Entre na sua conta." }, { status: 401 });
  const subscription = await prisma().subscription.findUnique({
    where: { ownerId: userId },
  });
  if (subscription?.status !== "active" || subscription.paidUntil <= new Date())
    return Response.json(
      { error: "É necessário ter uma assinatura ativa." },
      { status: 403 },
    );
  const parsed = addressSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      { error: "Preencha o endereço completo para localizar no mapa." },
      { status: 400 },
    );
  if (Date.now() - (recent.get(userId) ?? 0) < 2000)
    return Response.json(
      { error: "Aguarde um instante antes de buscar novamente." },
      { status: 429 },
    );
  if (recent.size > 1000) recent.clear();
  recent.set(userId, Date.now());
  const a = parsed.data;
  const url = new URL(
    process.env.PHOTON_URL ?? "https://photon.komoot.io/api/",
  );
  url.searchParams.set(
    "q",
    `${a.street}, ${a.number}, ${a.city}, ${a.state}, ${a.postalCode}, Brasil`,
  );
  url.searchParams.set("limit", "5");
  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": `Flow/1.0 (${appUrl})`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    const candidates = (Array.isArray(data.features) ? data.features : [])
      .filter(
        (f: { properties?: { countrycode?: string } }) =>
          f.properties?.countrycode?.toUpperCase() === "BR",
      )
      .map(
        (f: {
          geometry?: { coordinates?: number[] };
          properties: Record<string, string>;
        }) => ({
          latitude: f.geometry?.coordinates?.[1],
          longitude: f.geometry?.coordinates?.[0],
          label: [
            f.properties.name,
            f.properties.street,
            f.properties.housenumber,
            f.properties.district,
            f.properties.city,
            f.properties.state,
          ]
            .filter(Boolean)
            .join(", "),
        }),
      )
      .filter(
        (p: { latitude?: number; longitude?: number }) =>
          typeof p.latitude === "number" &&
          Number.isFinite(p.latitude) &&
          typeof p.longitude === "number" &&
          Number.isFinite(p.longitude),
      );
    return Response.json({ candidates });
  } catch {
    return Response.json(
      {
        error:
          "Não foi possível localizar automaticamente. Você pode marcar o ponto diretamente no mapa.",
      },
      { status: 502 },
    );
  }
}
