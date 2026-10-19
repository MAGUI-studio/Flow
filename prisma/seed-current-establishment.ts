import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  createProfessional,
  createService,
  owned,
} from "../src/lib/business-write";
import { planFeatures } from "../src/lib/plan-features";
import { emptyWeeklySchedule } from "../src/lib/weekly-schedule";
config({ path: ".env.local", quiet: true });
const connection = process.env.DATABASE_URL ?? "";
const url = new URL(connection);
if (
  process.env.NODE_ENV === "production" ||
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.port !== "5433" ||
  url.pathname !== "/flow"
)
  throw new Error("Seed permitido apenas no banco local do Flow.");
const establishmentId = "72485fe2-d7eb-439b-80eb-fe4629d01e9d";
const names = [
  "Bruno Oliveira",
  "Camila Santos",
  "Rafael Costa",
  "Marina Alves",
  "Lucas Ferreira",
  "Beatriz Lima",
];
const services = [
  { name: "Barba completa com toalha quente", minutes: 40, price: 4500 },
  { name: "Corte degradê", minutes: 45, price: 6500 },
  { name: "Corte infantil", minutes: 30, price: 4000 },
  { name: "Combo corte e barba", minutes: 75, price: 9500 },
  { name: "Hidratação capilar", minutes: 30, price: 3500 },
  { name: "Coloração e cobertura de brancos", minutes: 90, price: 12000 },
  { name: "Design de sobrancelhas", minutes: 15, price: 2000 },
  { name: "Avaliação de estilo gratuita", minutes: 20, price: 0 },
  {
    name: "Consultoria de visagismo online",
    minutes: 45,
    price: 8000,
    modality: "online",
  },
  {
    name: "Oficina de cuidados com a barba",
    minutes: 60,
    price: 5000,
    kind: "collective",
  },
  {
    name: "Workshop de penteados",
    minutes: 90,
    price: 9000,
    kind: "collective",
  },
  {
    name: "Orientação de cuidados em casa",
    minutes: 20,
    price: 0,
    modality: "online",
  },
];
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: connection }),
});
try {
  const result = await db.$transaction(
    async (tx) => {
      const business = await tx.establishment.findUniqueOrThrow({
        where: { id: establishmentId },
      });
      await owned(tx, business.ownerId, business.id);
      const subscription = await tx.subscription.findUniqueOrThrow({
        where: { ownerId: business.ownerId },
      });
      const limit = planFeatures(subscription.plan).professionals;
      let count = await tx.professional.count({
        where: { establishmentId, deletedAt: null },
      });
      let addedProfessionals = 0,
        addedServices = 0;
      for (const [index, name] of names.entries()) {
        if (
          await tx.professional.findFirst({
            where: { establishmentId, name, deletedAt: null },
          })
        )
          continue;
        if (count >= limit) break;
        const professional = await createProfessional(tx, business.ownerId, {
          establishmentId,
          name,
        });
        const schedule = emptyWeeklySchedule();
        schedule.days.forEach((day) => {
          day.enabled =
            index % 2 === 0
              ? [1, 2, 3, 4, 5].includes(day.weekday)
              : [2, 3, 4, 5, 6].includes(day.weekday);
          day.intervals =
            day.weekday === 6
              ? [{ start: "09:00", end: "13:00" }]
              : [
                  { start: index % 2 === 0 ? "09:00" : "10:00", end: "12:00" },
                  { start: "13:00", end: index % 2 === 0 ? "18:00" : "19:00" },
                ];
        });
        await tx.professional.update({
          where: { id: professional.id },
          data: { weeklySchedule: schedule },
        });
        count++;
        addedProfessionals++;
      }
      const professionals = await tx.professional.findMany({
        where: { establishmentId, deletedAt: null, active: true },
        orderBy: { name: "asc" },
      });
      if (!professionals.length)
        throw new Error("Nenhum profissional ativo disponível.");
      for (const [index, source] of services.entries()) {
        if (
          await tx.service.findFirst({
            where: { establishmentId, name: source.name },
          })
        )
          continue;
        const assigned = professionals.filter(
          (_, i) =>
            i === index % professionals.length ||
            i === (index + 2) % professionals.length,
        );
        await createService(tx, business.ownerId, {
          establishmentId,
          name: source.name,
          durationMinutes: source.minutes,
          priceCents: source.price,
          modality: source.modality ?? "in_person",
          kind: source.kind ?? "individual",
          stepMinutes: source.minutes === 15 ? 15 : 30,
          bufferBefore: 0,
          bufferAfter: source.minutes >= 60 ? 15 : 5,
          professionalIds: assigned.map((p) => p.id),
        });
        addedServices++;
      }
      const total = await tx.professional.count({
        where: { establishmentId, deletedAt: null },
      });
      if (total > limit) throw new Error("Limite de profissionais excedido.");
      return {
        establishment: business.name,
        plan: planFeatures(subscription.plan).name,
        limit,
        addedProfessionals,
        addedServices,
        totalProfessionals: total,
        totalServices: await tx.service.count({
          where: { establishmentId, active: true },
        }),
      };
    },
    { timeout: 30000 },
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await db.$disconnect();
}
