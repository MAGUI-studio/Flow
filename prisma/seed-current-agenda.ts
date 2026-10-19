import { config } from "dotenv";
import { createHash, randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { owned } from "../src/lib/business-write";
import { availabilityWindows } from "../src/lib/weekly-availability";
import { availableSlots } from "../src/lib/rules";
import { dayKey } from "../src/lib/format";
config({ path: ".env.local", quiet: true });
const connection = process.env.DATABASE_URL ?? "";
const url = new URL(connection);
if (
  process.env.NODE_ENV === "production" ||
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  url.port !== "5433" ||
  url.pathname !== "/flow"
)
  throw new Error("Apenas banco local Flow.");
const establishmentId = "72485fe2-d7eb-439b-80eb-fe4629d01e9d";
function seedId(index: number) {
  const h = createHash("sha256")
    .update(`flow-agenda-demo:${establishmentId}:${index}`)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: connection }),
});
try {
  const result = await db.$transaction(
    async (tx) => {
      const business = await tx.establishment.findUniqueOrThrow({
        where: { id: establishmentId },
      });
      await owned(tx, business.ownerId, establishmentId);
      const corrected =
        business.approvalMode === "automatic"
          ? await tx.booking.updateMany({
              where: {
                status: "pending",
                consumerId: { startsWith: "flow_demo_agenda_" },
                session: { establishmentId },
              },
              data: { status: "confirmed", expiresAt: null },
            })
          : { count: 0 };
      const services = await tx.service.findMany({
        where: { establishmentId, active: true },
        include: { professionals: { include: { professional: true } } },
        orderBy: { name: "asc" },
      });
      const collective = services.filter((s) => s.kind === "collective"),
        individual = services.filter((s) => s.kind === "individual");
      if (!collective.length || !individual.length)
        throw new Error(
          "Cadastre serviços individuais e em grupo antes do seed.",
        );
      const now = new Date();
      const from = dayKey(
        new Date(now.getTime() + 86400000),
        business.timezone,
      );
      const to = dayKey(
        new Date(now.getTime() + 21 * 86400000),
        business.timezone,
      );
      let addedSessions = 0,
        addedBookings = 0;
      for (let index = 0; index < 14; index++) {
        const id = seedId(index);
        if (await tx.session.findUnique({ where: { id } })) continue;
        const options = (index < 6 ? collective : individual).filter(
          (service) =>
            service.professionals.some(
              (link) =>
                link.professional.active &&
                !link.professional.deletedAt &&
                link.professional.weeklySchedule !== null,
            ),
        );
        if (!options.length)
          throw new Error("Sem profissionais com rotina semanal configurada.");
        const service = options[index % options.length];
        let created = false;
        for (const link of service.professionals) {
          const p = link.professional;
          if (!p.active || p.deletedAt) continue;
          const windows = await availabilityWindows(tx, p.id, from, to);
          const sessions = await tx.session.findMany({
            where: { professionalId: p.id, active: true, endsAt: { gt: now } },
          });
          const blocks = await tx.professionalBlock.findMany({
            where: { professionalId: p.id, endsAt: { gt: now } },
          });
          const busy = [
            ...sessions.map((s) => ({
              start: s.occupiedStart,
              end: s.occupiedEnd,
            })),
            ...blocks.map((b) => ({ start: b.startsAt, end: b.endsAt })),
            ...(p.vacationStartsAt && p.vacationEndsAt
              ? [{ start: p.vacationStartsAt, end: p.vacationEndsAt }]
              : []),
          ];
          const slots = windows
            .flatMap((w) =>
              availableSlots(
                { start: w.startsAt, end: w.endsAt },
                service.durationMinutes,
                service.stepMinutes,
                busy,
                service.bufferBefore,
                service.bufferAfter,
              ),
            )
            .filter((d) => d > now);
          const start = slots[Math.min(index * 2, slots.length - 1)];
          if (!start) continue;
          const end = new Date(
            start.getTime() + service.durationMinutes * 60000,
          );
          const capacity = index < 6 ? [6, 8, 10][index % 3] : 1;
          await tx.session.create({
            data: {
              id,
              establishmentId,
              professionalId: p.id,
              serviceId: service.id,
              startsAt: start,
              endsAt: end,
              occupiedStart: new Date(
                start.getTime() - service.bufferBefore * 60000,
              ),
              occupiedEnd: new Date(
                end.getTime() + service.bufferAfter * 60000,
              ),
              capacity,
            },
          });
          addedSessions++;
          const count = index < 6 ? [0, 2, capacity][index % 3] : 1;
          for (let n = 0; n < count; n++) {
            const consumerId = `flow_demo_agenda_${index}_${n}`;
            await tx.account.upsert({
              where: { id: consumerId },
              create: { id: consumerId },
              update: {},
            });
            const [reservation] = await tx.$queryRaw<
              { id: string }[]
            >`SELECT reserve_session(${id}::uuid,${consumerId}::text,${"+5511999990000"}::text,${randomUUID()}::uuid) AS id`;
            const status =
              index >= 6 && index % 4 === 0
                ? "canceled"
                : business.approvalMode === "manual" &&
                    index >= 6 &&
                    index % 4 === 1
                  ? "pending"
                  : "confirmed";
            await tx.booking.update({
              where: { id: reservation.id },
              data: {
                status,
                expiresAt:
                  status === "pending"
                    ? new Date(
                        Math.min(start.getTime(), now.getTime() + 86400000),
                      )
                    : null,
              },
            });
            addedBookings++;
          }
          created = true;
          break;
        }
        if (!created)
          throw new Error(`Sem horário disponível para ${service.name}.`);
      }
      return {
        approvalMode: business.approvalMode,
        correctedPending: corrected.count,
        addedSessions,
        addedBookings,
        collectiveSessions: await tx.session.count({
          where: {
            establishmentId,
            service: { kind: "collective" },
            startsAt: { gt: now },
          },
        }),
        bookings: await tx.booking.count({
          where: { session: { establishmentId } },
        }),
      };
    },
    { timeout: 60000 },
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await db.$disconnect();
}
