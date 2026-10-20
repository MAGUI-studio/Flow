import { weeklyScheduleSchema } from "./weekly-schedule";
import { prisma } from "./prisma";
import { effectiveTemplate, type TemplateId } from "./plan-features";
import { publicRatings } from "./public-ratings";
import { topRatedBusinessIds } from "./business-ranking";
import { locationSchema, type LocationPoint } from "./address";
export type BusinessCard = {
  location?: LocationPoint;
  id: string;
  slug: string;
  name: string;
  category: string;
  city: string;
  initials: string;
  color: string;
  tag: string;
  description: string;
  online: boolean;
  serviceNames: string[];
  modalities: string[];
  logoUrl?: string | null;
  coverUrl?: string | null;
  rating?: number | null;
  ratingCount?: number;
  isTopRated?: boolean;
};
export type BusinessProfile = BusinessCard & {
  location?: LocationPoint;
  templateId: TemplateId;
  timezone: string;
  address: string | null;
  contactPhone: string | null;
  approvalMode: string;
  cancelNoticeHours: number;
  logoUrl: string | null;
  coverUrl: string | null;
  services: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
    kind: string;
    modality: string;
    professionalIds: string[];
  }[];
  professionals: { id: string; name: string; photoUrl?: string }[];
};
export async function catalog() {
  const rows = await prisma().establishment.findMany({
    where: {
      active: true,
      owner: {
        subscription: {
          is: { status: "active", paidUntil: { gt: new Date() } },
        },
      },
    },
    include: { services: { where: { active: true } } },
    orderBy: { name: "asc" },
  });
  const ratings = await publicRatings(rows.map((e) => e.id));
  const cards = rows.map((e) => ({
    ...(() => {
      const point = locationSchema.safeParse(
        e.addressDetails &&
          typeof e.addressDetails === "object" &&
          !Array.isArray(e.addressDetails)
          ? e.addressDetails.location
          : undefined,
      );
      return point.success ? { location: point.data } : {};
    })(),
    rating: ratings.get(e.id)?.rating ?? null,
    ratingCount: ratings.get(e.id)?.ratingCount ?? 0,
    logoUrl: e.logoUrl,
    coverUrl: e.coverUrl,
    id: e.id,
    slug: e.slug,
    name: e.name,
    category: e.category,
    city: e.city ?? "Online",
    initials: e.name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toLowerCase(),
    color: e.color,
    tag: e.category,
    description: e.description ?? "",
    serviceNames: e.services.map((s) => s.name),
    modalities: [...new Set(e.services.map((s) => s.modality))],
    online:
      e.services.length > 0 && e.services.every((s) => s.modality === "online"),
  }));
  const topRated = topRatedBusinessIds(cards);
  return cards.map((card) => ({ ...card, isTopRated: topRated.has(card.id) }));
}
export async function profile(slug: string): Promise<BusinessProfile | null> {
  const e = await prisma().establishment.findUnique({
    where: { slug },
    include: {
      owner: { include: { subscription: true } },
      professionals: {
        where: { active: true, deletedAt: null },
        orderBy: { name: "asc" },
        include: {
          photo: { select: { url: true } },
          windows: {
            where: { endsAt: { gt: new Date() } },
            select: { id: true },
            take: 1,
          },
        },
      },
      services: {
        where: { active: true },
        include: { professionals: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (
    !e ||
    !e.active ||
    e.owner.subscription?.status !== "active" ||
    e.owner.subscription.paidUntil <= new Date()
  )
    return null;
  const bookableProfessionals = e.professionals.filter((p) => {
    if (p.weeklySchedule === null) return p.windows.length > 0;
    const schedule = weeklyScheduleSchema.safeParse(p.weeklySchedule);
    return (
      schedule.success &&
      schedule.data.days.some((day) => day.enabled && day.intervals.length > 0)
    );
  });
  const bookableIds = new Set(bookableProfessionals.map((p) => p.id));
  const bookableServices = e.services.filter((service) =>
    service.professionals.some((link) => bookableIds.has(link.professionalId)),
  );
  const card = (await catalog()).find((business) => business.id === e.id);
  const details = e.addressDetails;
  const location = locationSchema.safeParse(
    details && typeof details === "object" && !Array.isArray(details)
      ? details.location
      : undefined,
  );
  return {
    ...(location.success ? { location: location.data } : {}),
    rating: card?.rating ?? null,
    ratingCount: card?.ratingCount ?? 0,
    isTopRated: card?.isTopRated ?? false,
    templateId: effectiveTemplate(e.templateId, e.owner.subscription.plan),
    id: e.id,
    slug: e.slug,
    name: e.name,
    category: e.category,
    city: e.city ?? "Online",
    initials: e.name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toLowerCase(),
    color: e.color,
    tag: e.category,
    description: e.description ?? "",
    serviceNames: e.services.map((s) => s.name),
    modalities: [...new Set(e.services.map((s) => s.modality))],
    online:
      e.services.length > 0 && e.services.every((s) => s.modality === "online"),
    timezone: e.timezone,
    address: e.address,
    contactPhone: e.contactPhone,
    approvalMode: e.approvalMode,
    cancelNoticeHours: e.cancelNoticeHours,
    logoUrl: e.logoUrl,
    coverUrl: e.coverUrl,
    professionals: bookableProfessionals.map((p) => ({
      id: p.id,
      name: p.name,
      photoUrl: p.photo?.url,
    })),
    services: bookableServices.map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      priceCents: s.priceCents,
      kind: s.kind,
      modality: s.modality,
      professionalIds: s.professionals
        .filter((p) => bookableIds.has(p.professionalId))
        .map((p) => p.professionalId),
    })),
  };
}
