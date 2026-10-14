import type { Prisma } from "@/generated/prisma/client";
export const categories = [
  "Beleza",
  "Barbearia",
  "Saúde",
  "Bem-estar",
  "Educação",
  "Consultoria",
  "Outros",
];
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
      "painel",
      "planos",
      "agendamentos",
      "entrar",
      "sign-in",
      "sign-up",
      "api",
      "admin",
    ].includes(slug)
  )
    throw new Error("INVALID_SLUG");
  const category = text(input.category);
  if (!categories.includes(category)) throw new Error("INVALID_INPUT");
  return tx.establishment.create({
    data: {
      ownerId: owner,
      name: text(input.name),
      slug,
      category,
      city: input.city ? text(input.city) : null,
      address: input.address ? text(input.address, 1, 300) : null,
      description: input.description ? text(input.description, 1, 1000) : null,
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
  if (
    (await tx.professional.count({
      where: { establishmentId: e.id, active: true },
    })) >= 10
  )
    throw new Error("PROFESSIONAL_LIMIT");
  return tx.professional.create({
    data: { establishmentId: e.id, name: text(input.name) },
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
