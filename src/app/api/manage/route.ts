import { professionalCreationSchema } from "@/lib/form-schemas";
import { isWithinAvailability } from "@/lib/weekly-availability";
import { currentUser, apiError } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { businessSlug } from "@/lib/business-slug";
import { professionalVacationOverlaps } from "@/lib/professional-status";
import {
  createEstablishment,
  createProfessional,
  createService,
  owned,
  text,
  integer,
} from "@/lib/business-write";
export async function POST(request: Request) {
  try {
    const owner = await currentUser();
    const input = await request.json();
    if (!input || typeof input !== "object") throw new Error("INVALID_INPUT");
    const result = await prisma().$transaction(async (tx) => {
      if (input.type === "establishment") {
        const automatic = businessSlug(text(input.name));
        if (
          input.slug !== automatic &&
          !(await tx.establishment.findUnique({
            where: { slug: automatic },
            select: { id: true },
          }))
        )
          throw new Error("INVALID_SLUG");
        return createEstablishment(tx, owner, input);
      }
      if (input.type === "professional")
        return createProfessional(tx, owner, {
          ...input,
          ...professionalCreationSchema.parse(input),
        });
      if (input.type === "service") return createService(tx, owner, input);
      const e = await owned(tx, owner, text(input.establishmentId));
      if (input.type === "availability") {
        const professional = await tx.professional.findFirst({
          where: {
            id: text(input.professionalId),
            establishmentId: e.id,
            active: true,
          },
        });
        if (!professional) throw new Error("INVALID_INPUT");
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
          !/^\d{2}:\d{2}$/.test(input.start) ||
          !/^\d{2}:\d{2}$/.test(input.end)
        )
          throw new Error("INVALID_INPUT");
        const bounds = await tx.$queryRaw<
          { start: Date; end: Date }[]
        >`SELECT (${input.date + " " + input.start}::timestamp AT TIME ZONE ${e.timezone}) AS start,(${input.date + " " + input.end}::timestamp AT TIME ZONE ${e.timezone}) AS end`;
        if (bounds[0].end <= bounds[0].start || bounds[0].end <= new Date())
          throw new Error("INVALID_INPUT");
        if (input.block)
          return tx.professionalBlock.create({
            data: {
              professionalId: professional.id,
              startsAt: bounds[0].start,
              endsAt: bounds[0].end,
              reason: "Bloqueio de agenda",
            },
          });
        return tx.availabilityWindow.create({
          data: {
            professionalId: professional.id,
            startsAt: bounds[0].start,
            endsAt: bounds[0].end,
          },
        });
      }
      if (input.type === "session") {
        const service = await tx.service.findFirst({
          where: {
            id: text(input.serviceId),
            establishmentId: e.id,
            kind: "collective",
            active: true,
            professionals: {
              some: { professionalId: text(input.professionalId) },
            },
          },
        });
        if (!service) throw new Error("INVALID_INPUT");
        const starts = (
          await tx.$queryRaw<
            { start: Date }[]
          >`SELECT (${text(input.date) + " " + text(input.start)}::timestamp AT TIME ZONE ${e.timezone}) AS start`
        )[0].start;
        const ends = new Date(
          starts.getTime() + service.durationMinutes * 60000,
        );
        const occupiedStart = new Date(
            starts.getTime() - service.bufferBefore * 60000,
          ),
          occupiedEnd = new Date(ends.getTime() + service.bufferAfter * 60000);
        const professional = await tx.professional.findFirst({
          where: {
            id: text(input.professionalId),
            establishmentId: e.id,
            active: true,
            deletedAt: null,
          },
        });
        if (
          !professional ||
          professionalVacationOverlaps(
            occupiedStart,
            occupiedEnd,
            professional.vacationStartsAt,
            professional.vacationEndsAt,
          )
        )
          throw new Error("PROFESSIONAL_UNAVAILABLE");
        if (
          starts <= new Date() ||
          !(await isWithinAvailability(
            tx,
            text(input.professionalId),
            occupiedStart,
            occupiedEnd,
          )) ||
          (await tx.professionalBlock.findFirst({
            where: {
              professionalId: text(input.professionalId),
              startsAt: { lt: occupiedEnd },
              endsAt: { gt: occupiedStart },
            },
          }))
        )
          throw new Error("OUTSIDE_AVAILABILITY");
        return tx.session.create({
          data: {
            establishmentId: e.id,
            professionalId: text(input.professionalId),
            serviceId: service.id,
            startsAt: starts,
            endsAt: ends,
            occupiedStart,
            occupiedEnd,
            capacity: integer(input.capacity, 1, 1000),
          },
        });
      }
      throw new Error("INVALID_INPUT");
    });
    return Response.json({ id: result.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
