import type { Prisma } from "@/generated/prisma/client";
import { owned, professionalPhotoId } from "./business-write";
import { professionalSchema } from "./form-schemas";
import { professionalStatusSchema } from "./professional-status";
export async function editProfessional(
  tx: Prisma.TransactionClient,
  owner: string,
  establishmentId: string,
  id: string,
  input: unknown,
) {
  const fields = professionalSchema.partial().parse(input);
  const e = await owned(tx, owner, establishmentId);
  const p = await tx.professional.findFirst({
    where: { id, establishmentId, deletedAt: null },
  });
  if (!p) throw new Error("FORBIDDEN");
  if (input && typeof input === "object" && "status" in input)
    await updateProfessionalStatus(tx, owner, establishmentId, id, input);
  const updated = await tx.professional.update({
    where: { id },
    data: {
      ...(fields.name !== undefined ? { name: fields.name } : {}),
      ...(fields.photoId !== undefined
        ? {
            photoId: await professionalPhotoId(
              tx,
              owner,
              establishmentId,
              fields.photoId,
            ),
          }
        : {}),
    },
    select: { id: true, name: true, photo: { select: { url: true } } },
  });
  return { updated, slug: e.slug };
}
export async function updateProfessionalStatus(
  tx: Prisma.TransactionClient,
  owner: string,
  establishmentId: string,
  id: string,
  input: unknown,
) {
  const change = professionalStatusSchema.parse(input);
  const e = await owned(tx, owner, establishmentId);
  await tx.$queryRaw`SELECT id FROM professionals WHERE id=${id}::uuid FOR UPDATE`;
  const p = await tx.professional.findFirst({
    where: { id, establishmentId, deletedAt: null },
  });
  if (!p) throw new Error("FORBIDDEN");
  let start: Date | null = null,
    end: Date | null = null;
  if (change.status === "vacation") {
    const period = (
      await tx.$queryRaw<
        { start: Date; end: Date }[]
      >`SELECT (${change.start}::date::timestamp AT TIME ZONE ${e.timezone}) AS start,((${change.end}::date+1)::timestamp AT TIME ZONE ${e.timezone}) AS end`
    )[0];
    start = period.start;
    end = period.end;
    if (end <= new Date()) throw new Error("INVALID_INPUT");
    if (
      await tx.booking.findFirst({
        where: {
          session: {
            professionalId: id,
            endsAt: { gt: new Date() },
            occupiedStart: { lt: end },
            occupiedEnd: { gt: start },
          },
          OR: [
            { status: "confirmed" },
            { status: "pending", expiresAt: { gt: new Date() } },
          ],
        },
        select: { id: true },
      })
    )
      throw new Error("VACATION_BOOKINGS_CONFLICT");
  }
  await tx.professional.update({
    where: { id },
    data: {
      active: change.status !== "inactive",
      vacationStartsAt: start,
      vacationEndsAt: end,
    },
  });
  return e.slug;
}
export async function deleteProfessional(
  tx: Prisma.TransactionClient,
  owner: string,
  establishmentId: string,
  id: string,
) {
  const e = await owned(tx, owner, establishmentId);
  await tx.$queryRaw`SELECT id FROM professionals WHERE id=${id}::uuid FOR UPDATE`;
  const p = await tx.professional.findFirst({
    where: { id, establishmentId, deletedAt: null },
  });
  if (!p) throw new Error("FORBIDDEN");
  if (
    await tx.booking.findFirst({
      where: {
        session: { professionalId: id, endsAt: { gt: new Date() } },
        OR: [
          { status: "confirmed" },
          { status: "pending", expiresAt: { gt: new Date() } },
        ],
      },
      select: { id: true },
    })
  )
    throw new Error("PROFESSIONAL_HAS_BOOKINGS");
  // Keep relationships needed by reservations and reviews; removal is permanent in the portal.
  await tx.professional.update({
    where: { id },
    data: {
      active: false,
      deletedAt: new Date(),
      vacationStartsAt: null,
      vacationEndsAt: null,
    },
  });
  return e.slug;
}
