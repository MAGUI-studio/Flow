import { prisma } from "./prisma";
export type BusinessCard = {
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
};
export type BusinessProfile = BusinessCard & {
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
  professionals: { id: string; name: string }[];
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
  return rows.map((e) => ({
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
}
export async function profile(slug: string): Promise<BusinessProfile | null> {
  const e = await prisma().establishment.findUnique({
    where: { slug },
    include: {
      owner: { include: { subscription: true } },
      professionals: { where: { active: true }, orderBy: { name: "asc" } },
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
  return {
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
    professionals: e.professionals.map((p) => ({ id: p.id, name: p.name })),
    services: e.services.map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      priceCents: s.priceCents,
      kind: s.kind,
      modality: s.modality,
      professionalIds: s.professionals.map((p) => p.professionalId),
    })),
  };
}
