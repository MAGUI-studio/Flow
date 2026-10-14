import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  createEstablishment,
  createProfessional,
  createService,
} from "../src/lib/business-write";
import { businesses } from "./seed-data";
import { seedReviews } from "./seed-reviews";
config({ path: ".env.local", quiet: true });
if (
  process.env.NODE_ENV === "production" ||
  !/^postgres(?:ql)?:\/\/[^@]+@(localhost|127\.0\.0\.1):5433\/flow(?:\?|$)/.test(
    process.env.DATABASE_URL ?? "",
  )
)
  throw new Error("Seed permitido apenas no PostgreSQL local do Flow.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
try {
  for (const [index, input] of businesses.entries()) {
    const owner = `flow_seed_owner_${Math.floor(index / 2) + 1}`;
    await db.account.upsert({
      where: { id: owner },
      create: { id: owner },
      update: {},
    });
    await db.subscription.upsert({
      where: { ownerId: owner },
      create: {
        ownerId: owner,
        plan: "multi",
        status: "active",
        provider: "seed",
        paidUntil: new Date("2030-01-01"),
      },
      update: {},
    });
    let e = await db.establishment.findUnique({ where: { slug: input.slug } });
    if (!e)
      e = await db.$transaction((tx) =>
        createEstablishment(tx, owner, {
          ...input,
          address: input.online
            ? ""
            : `Rua das Flores, ${120 + index * 20} — Centro`,
        }),
      );
    if (e.ownerId !== owner)
      throw new Error(
        `Slug ${input.slug} pertence a outra conta; seed interrompido.`,
      );
    await db.establishment.update({
      where: { id: e.id },
      data: {
        color: input.color,
        approvalMode: input.approvalMode ?? "automatic",
      },
    });
    for (const name of input.professionals) {
      let p = await db.professional.findFirst({
        where: { establishmentId: e.id, name },
      });
      if (!p)
        p = await db.$transaction((tx) =>
          createProfessional(tx, owner, { establishmentId: e!.id, name }),
        );
      for (let d = 1; d <= (index === 7 ? 7 : 45); d++) {
        const day = input.future
          ? new Date("2027-03-01T00:00:00Z")
          : new Date();
        day.setUTCHours(0, 0, 0, 0);
        day.setUTCDate(day.getUTCDate() + d);
        if (day.getUTCDay() === 0) continue;
        for (const [from, to] of [
          [12, 15],
          [16, 22],
        ]) {
          const startsAt = new Date(day.getTime() + from * 3600000),
            endsAt = new Date(day.getTime() + to * 3600000);
          if (
            !(await db.availabilityWindow.findFirst({
              where: { professionalId: p.id, startsAt, endsAt },
            }))
          )
            await db.availabilityWindow.create({
              data: { professionalId: p.id, startsAt, endsAt },
            });
        }
      }
      const blockedDay = input.future
        ? new Date("2027-03-04T17:00:00Z")
        : new Date();
      if (!input.future) {
        blockedDay.setUTCDate(blockedDay.getUTCDate() + 2);
        blockedDay.setUTCHours(17, 0, 0, 0);
      }
      const blockedEnd = new Date(blockedDay.getTime() + 30 * 60000);
      if (
        !(await db.professionalBlock.findFirst({
          where: {
            professionalId: p.id,
            startsAt: blockedDay,
            endsAt: blockedEnd,
          },
        }))
      )
        await db.professionalBlock.create({
          data: {
            professionalId: p.id,
            startsAt: blockedDay,
            endsAt: blockedEnd,
            reason: "Pausa de atendimento",
          },
        });
    }
    const professionals = await db.professional.findMany({
      where: { establishmentId: e.id },
    });
    for (const [serviceIndex, source] of input.services.entries()) {
      const assigned = professionals.filter(
        (p) => !source.professionals || source.professionals.includes(p.name),
      );
      let s = await db.service.findFirst({
        where: { establishmentId: e.id, name: source.name },
      });
      if (!s)
        s = await db.$transaction((tx) =>
          createService(tx, owner, {
            name: source.name,
            durationMinutes: source.minutes,
            priceCents: source.price,
            establishmentId: e!.id,
            professionalIds: assigned.map((p) => p.id),
            stepMinutes: source.step ?? 30,
            bufferBefore: source.bufferBefore ?? 0,
            bufferAfter: source.bufferAfter ?? 0,
            modality:
              source.modality ?? (input.online ? "online" : "in_person"),
            kind: source.kind ?? "individual",
          }),
        );
      if (s.kind === "collective")
        for (let d = 1; d <= 45; d++) {
          const startsAt = new Date();
          startsAt.setUTCHours(
            source.name === "Yoga em grupo" ? 21 : 18 + (serviceIndex % 3),
            0,
            0,
            0,
          );
          startsAt.setUTCDate(startsAt.getUTCDate() + d);
          if (![2, 4, 6].includes(startsAt.getUTCDay())) continue;
          if (
            !(await db.session.findFirst({
              where: {
                professionalId: assigned[0].id,
                serviceId: s.id,
                startsAt,
              },
            }))
          )
            await db.session.create({
              data: {
                establishmentId: e.id,
                professionalId: assigned[0].id,
                serviceId: s.id,
                startsAt,
                endsAt: new Date(
                  startsAt.getTime() + s.durationMinutes * 60000,
                ),
                occupiedStart: startsAt,
                occupiedEnd: new Date(
                  startsAt.getTime() + s.durationMinutes * 60000,
                ),
                capacity: source.capacity ?? 10,
              },
            });
        }
    }
  }
  for (const [slug, count] of [
    ["movimento-yoga", 2],
    ["casa-do-movimento", 2],
    ["norte-consultoria", 1],
  ] as const) {
    const session = await db.session.findFirst({
      where: {
        establishment: { slug },
        active: true,
        startsAt: { gt: new Date() },
      },
      orderBy: { startsAt: "asc" },
    });
    if (!session) continue;
    for (let index = 0; index < Math.min(count, session.capacity); index++) {
      const consumer = `flow_seed_visitor_${index + 1}`;
      await db.account.upsert({
        where: { id: consumer },
        create: { id: consumer },
        update: {},
      });
      if (
        !(await db.booking.findFirst({
          where: { sessionId: session.id, consumerId: consumer },
        }))
      )
        await db.$queryRaw`SELECT reserve_session(${session.id}::uuid,${consumer}::text,${"+5511999990000"}::text,${randomUUID()}::uuid)`;
    }
  }
  const reviewsCreated = await seedReviews(db);
  console.log(
    `${reviewsCreated} avaliações adicionadas a agendamentos históricos do seed.`,
  );
  console.log(
    "Seed concluído: estabelecimentos, profissionais, serviços e agendas persistidos.",
  );
} finally {
  await db.$disconnect();
}
