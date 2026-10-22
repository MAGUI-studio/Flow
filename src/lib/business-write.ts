import { businessContactsSchema } from "./business-contacts";
import { weeklyScheduleSchema } from "./weekly-schedule";
import type { Prisma } from "@/generated/prisma/client";
import { planFeatures } from "./plan-features";
import { optionalAddressSchema, formatAddress } from "./address";
import {
  businessCategories,
  businessBioMaxLength,
} from "./business-categories";
export const categories: readonly string[] = businessCategories;
export function text(value: unknown, min = 1, max = 150) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new Error("INVALID_INPUT");
  return value.trim();
}
export function integer(value: unknown, min: number, max: number) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max)
    throw new Error("INVALID_INPUT");
  return n;
}
export async function paidAccount(tx: Prisma.TransactionClient, owner: string) {
  await tx.$queryRaw`SELECT id FROM accounts WHERE id=${owner} FOR UPDATE`;
  const sub = await tx.subscription.findUnique({ where: { ownerId: owner } });
  if (!sub || sub.status !== "active" || sub.paidUntil <= new Date())
    throw new Error("FORBIDDEN");
  return sub;
}
export async function owned(
  tx: Prisma.TransactionClient,
  owner: string,
  id: string,
) {
  await paidAccount(tx, owner);
  const e = await tx.establishment.findFirst({
    where: { id, ownerId: owner, active: true },
  });
  if (!e) throw new Error("FORBIDDEN");
  await tx.$queryRaw`SELECT id FROM establishments WHERE id=${id}::uuid FOR UPDATE`;
  return e;
}
export async function createEstablishment(
  tx: Prisma.TransactionClient,
  owner: string,
  input: Record<string, unknown>,
) {
  const parsedContacts = businessContactsSchema.safeParse(input);
  if (!parsedContacts.success) throw new Error("INVALID_INPUT");
  const contacts = parsedContacts.data;
  const coverUrl = await businessBannerUrl(tx, owner, contacts.bannerId);
  const sub = await paidAccount(tx, owner);
  if (
    (await tx.establishment.count({ where: { ownerId: owner } })) >=
    (sub.plan === "multi" ? 3 : 1)
  )
    throw new Error("PLAN_LIMIT");
  const slug = text(input.slug, 3, 70);
  if (
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ||
    [
      "termos",
      "privacidade",
      "painel",
      "planos",
      "assinatura",
      "agendamentos",
      "favoritos",
      "explorar",
      "entrar",
      "sign-in",
      "sign-up",
      "criar-conta",
      "api",
      "admin",
    ].includes(slug)
  )
    throw new Error("INVALID_SLUG");
  const category = text(input.category);
  if (!categories.includes(category)) throw new Error("INVALID_INPUT");
  const parsedAddress = optionalAddressSchema.safeParse(input.addressDetails);
  if (!parsedAddress.success) throw new Error("INVALID_INPUT");
  const addressDetails = parsedAddress.data;
  return tx.establishment.create({
    data: {
      ownerId: owner,
      published: false,
      website: contacts.website || null,
      instagram: contacts.instagram || null,
      coverUrl,
      name: text(input.name),
      slug,
      category,
      city: addressDetails
        ? `${addressDetails.city}, ${addressDetails.state}`
        : input.city
          ? text(input.city)
          : null,
      address: addressDetails
        ? formatAddress(addressDetails)
        : input.address
          ? text(input.address, 1, 300)
          : null,
      ...(addressDetails ? { addressDetails } : {}),
      description: input.description
        ? text(input.description, 1, businessBioMaxLength)
        : null,
      contactPhone: input.contactPhone ? text(input.contactPhone, 8, 30) : null,
      approvalMode: input.approvalMode === "manual" ? "manual" : "automatic",
      cancelNoticeHours: integer(input.cancelNoticeHours ?? 2, 0, 720),
    },
  });
}
export async function createProfessional(
  tx: Prisma.TransactionClient,
  owner: string,
  input: Record<string, unknown>,
) {
  const e = await owned(tx, owner, text(input.establishmentId));
  const subscription = await tx.subscription.findUniqueOrThrow({
    where: { ownerId: owner },
  });
  if (
    (await tx.professional.count({
      where: { establishmentId: e.id, deletedAt: null },
    })) >= planFeatures(subscription.plan).professionals
  )
    throw new Error("PROFESSIONAL_LIMIT");
  const photoId = await professionalPhotoId(tx, owner, e.id, input.photoId);
  return tx.professional.create({
    data: {
      establishmentId: e.id,
      name: text(input.name),
      photoId,
      ...(input.days
        ? { weeklySchedule: weeklyScheduleSchema.parse({ days: input.days }) }
        : {}),
    },
  });
}
export async function createService(
  tx: Prisma.TransactionClient,
  owner: string,
  input: Record<string, unknown>,
) {
  const e = await owned(tx, owner, text(input.establishmentId));
  const ids = Array.isArray(input.professionalIds)
    ? [...new Set(input.professionalIds.map((id) => text(id)))]
    : [];
  if (
    !ids.length ||
    (await tx.professional.count({
      where: { id: { in: ids }, establishmentId: e.id, active: true },
    })) !== ids.length
  )
    throw new Error("INVALID_INPUT");
  const service = await tx.service.create({
    data: {
      establishmentId: e.id,
      name: text(input.name),
      durationMinutes: integer(input.durationMinutes, 5, 1440),
      stepMinutes: integer(input.stepMinutes ?? 30, 5, 1440),
      bufferBefore: integer(input.bufferBefore ?? 0, 0, 240),
      bufferAfter: integer(input.bufferAfter ?? 0, 0, 240),
      priceCents: integer(input.priceCents, 0, 100000000),
      modality: input.modality === "online" ? "online" : "in_person",
      kind: input.kind === "collective" ? "collective" : "individual",
    },
  });
  await tx.professionalService.createMany({
    data: ids.map((professionalId) => ({
      professionalId,
      establishmentId: e.id,
      serviceId: service.id,
    })),
  });
  return service;
}

export async function professionalPhotoId(
  tx: Prisma.TransactionClient,
  owner: string,
  establishmentId: string,
  input: unknown,
) {
  if (input === undefined || input === "" || input === null) return null;
  const photo = await tx.professionalPhoto.findFirst({
    where: {
      id: text(input),
      ownerId: owner,
      establishmentId,
      professional: null,
    },
  });
  if (!photo) throw new Error("INVALID_INPUT");
  return photo.id;
}

export async function businessBannerUrl(
  tx: Prisma.TransactionClient,
  owner: string,
  id: unknown,
) {
  if (!id) return null;
  const banner = await tx.businessBanner.findFirst({
    where: { id: text(id), ownerId: owner },
  });
  if (!banner) throw new Error("INVALID_INPUT");
  return banner.url;
}
