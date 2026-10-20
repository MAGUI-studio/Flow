import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  emptyWeeklySchedule,
  weeklyScheduleSchema,
} from "../src/lib/weekly-schedule";
import { owned } from "../src/lib/business-write";
config({ path: ".env.local", quiet: true });
const connection = process.env.DATABASE_URL ?? "";
const url = new URL(connection);
if (
  process.env.NODE_ENV === "production" ||
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.port !== "5433" ||
  url.pathname !== "/flow"
)
  throw Error("Apenas banco local do Flow.");
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: connection }),
});
const establishmentId = "72485fe2-d7eb-439b-80eb-fe4629d01e9d";
const ids = [
  "be7e7c18-db6c-421a-9463-4785922bfea8",
  "914fe13e-803c-4b8c-81d2-bb870d77710c",
  "424ab3b5-49ee-4b95-818d-dc0a3b40c382",
  "ae1fae5f-ff01-4618-be99-9f45f02775b9",
];
try {
  const result = await db.$transaction(async (tx) => {
    const business = await tx.establishment.findUniqueOrThrow({
      where: { id: establishmentId },
    });
    await owned(tx, business.ownerId, business.id);
    const people = await tx.professional.findMany({
      where: {
        id: { in: ids },
        establishmentId,
        active: true,
        deletedAt: null,
      },
    });
    if (people.length !== 4)
      throw Error(
        "Os quatro profissionais precisam estar ativos no estabelecimento.",
      );
    const schedule = emptyWeeklySchedule();
    schedule.days.forEach((day) => {
      day.enabled = day.weekday !== 0;
      day.intervals =
        day.weekday === 6
          ? [{ start: "09:00", end: "13:00" }]
          : [
              { start: "09:00", end: "12:00" },
              { start: "13:00", end: "18:00" },
            ];
    });
    weeklyScheduleSchema.parse(schedule);
    let updated = 0;
    for (const person of people) {
      if (person.weeklySchedule !== null) continue;
      await tx.professional.update({
        where: { id: person.id },
        data: { weeklySchedule: schedule },
      });
      updated++;
    }
    const windows = await tx.$queryRaw<
      { name: string; periods: number }[]
    >`SELECT p.name,count(w.starts_at)::int AS periods FROM professionals p JOIN establishments e ON e.id=p.establishment_id CROSS JOIN LATERAL professional_availability_windows(p.id,(now() AT TIME ZONE e.timezone)::date,((now() AT TIME ZONE e.timezone)::date+7)) w WHERE p.id IN (${ids[0]}::uuid,${ids[1]}::uuid,${ids[2]}::uuid,${ids[3]}::uuid) GROUP BY p.id,p.name ORDER BY p.name`;
    return { updated, timezone: business.timezone, professionals: windows };
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await db.$disconnect();
}
