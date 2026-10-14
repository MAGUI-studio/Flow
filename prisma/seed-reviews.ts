import { randomUUID } from "node:crypto";
import type { PrismaClient } from "../src/generated/prisma/client";
import { createReview } from "../src/lib/reviews";
const fixtures = [
  {
    slug: "studio-aurora",
    scores: [
      [5, 5],
      [4.5, 5],
      [5, 4.5],
      [4, 4.5],
      [5, 5],
      [4.5, 4.5],
    ],
  },
  {
    slug: "barbearia-essencia",
    scores: [
      [4, 4.5],
      [4.5, 5],
      [5, 4.5],
      [3.5, 4],
      [4, 4.5],
      [4.5, 4],
      [0, 2.5],
    ],
  },
  {
    slug: "casa-do-movimento",
    scores: [
      [3, 3.5],
      [3.5, 4],
      [4, 4.5],
      [4.5, 4],
    ],
  },
  {
    slug: "clinica-viva",
    scores: [
      [5, 5],
      [5, 4.5],
      [4.5, 5],
      [5, 5],
      [4.5, 4.5],
      [5, 5],
      [5, 5],
      [4.5, 5],
      [5, 4.5],
    ],
  },
  {
    slug: "conecta-idiomas",
    scores: [
      [4, 4.5],
      [4.5, 5],
      [5, 5],
      [5, 4.5],
      [4, 4.5],
    ],
  },
  {
    slug: "movimento-yoga",
    scores: [
      [5, 5],
      [4.5, 5],
      [5, 4.5],
    ],
  },
  {
    slug: "norte-consultoria",
    scores: [
      [2.5, 3],
      [3, 4],
      [4, 3.5],
      [3.5, 4],
      [4, 4],
      [3, 3.5],
      [4.5, 4],
      [3.5, 3.5],
    ],
  },
  {
    slug: "atelier-linha-fina",
    scores: [
      [5, 5],
      [4.5, 5],
      [5, 4.5],
      [5, 5],
      [4.5, 4.5],
    ],
  },
];
export async function seedReviews(db: PrismaClient) {
  let created = 0;
  for (const fixture of fixtures) {
    const business = await db.establishment.findUnique({
      where: { slug: fixture.slug },
      include: {
        services: {
          include: { professionals: true },
          orderBy: { name: "asc" },
        },
      },
    });
    if (!business || !business.ownerId.startsWith("flow_seed_owner_")) continue;
    const services = business.services.filter(
      (service) => service.professionals.length > 0,
    );
    if (!services.length) continue;
    for (const [index, scores] of fixture.scores.entries()) {
      const consumer = `flow_seed_reviewer_${fixture.slug}_${index + 1}`;
      await db.account.upsert({
        where: { id: consumer },
        create: { id: consumer },
        update: {},
      });
      // Fixed historical dates make repeat runs idempotent without touching user reservations.
      const startsAt = new Date(Date.UTC(2026, 0, 5 + index, 12));
      if (startsAt.getTime() + 24 * 3600000 > Date.now()) continue;
      await db.$transaction(async (tx) => {
        if (
          await tx.booking.findFirst({
            where: {
              consumerId: consumer,
              session: { establishmentId: business.id },
            },
            select: { id: true },
          })
        )
          return;
        const service = services[index % services.length];
        const professional =
          service.professionals[index % service.professionals.length];
        const endsAt = new Date(
          startsAt.getTime() + service.durationMinutes * 60000,
        );
        const session = await tx.session.create({
          data: {
            establishmentId: business.id,
            serviceId: service.id,
            professionalId: professional.professionalId,
            startsAt,
            endsAt,
            occupiedStart: new Date(
              startsAt.getTime() - service.bufferBefore * 60000,
            ),
            occupiedEnd: new Date(
              endsAt.getTime() + service.bufferAfter * 60000,
            ),
            capacity: service.kind === "collective" ? 10 : 1,
          },
        });
        const booking = await tx.booking.create({
          data: {
            sessionId: session.id,
            consumerId: consumer,
            status: "completed",
            priceCents: service.priceCents,
            durationMinutes: service.durationMinutes,
            idempotencyKey: randomUUID(),
            attendanceAt: startsAt,
          },
        });
        await createReview(tx, consumer, {
          bookingId: booking.id,
          establishmentScore: scores[0],
          professionalScore: scores[1],
        });
        created++;
      });
    }
  }
  return created;
}
