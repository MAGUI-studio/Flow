import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  createEstablishment,
  createProfessional,
  createService,
} from "../src/lib/business-write";
import { setupState } from "../src/lib/business-setup";
import { emptyWeeklySchedule } from "../src/lib/weekly-schedule";
import { getAvailability } from "../src/lib/availability";
import { createReview } from "../src/lib/reviews";
import { completeOverdueBookings } from "../src/lib/booking-completion";
import { bookingReminders, readNotifications } from "../src/lib/notifications";
import { publicRatings } from "../src/lib/public-ratings";
test("subscriber journey: draft, team, service, publication, reservation, notifications, completion and review", async () => {
  const connectionString =
    "postgresql://flow:flow_local_only@127.0.0.1:5433/flow";
  const schema = "flow_journey_" + randomUUID().replaceAll("-", "");
  const admin = new Pool({ connectionString, max: 1 });
  const db = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, options: `-c search_path=${schema},public` },
      { schema },
    ),
  });
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    for (const m of (
      await readdir(new URL("../prisma/migrations/", import.meta.url))
    )
      .filter((n) => /^\d/.test(n))
      .sort())
      await db.$executeRawUnsafe(
        await readFile(
          new URL(`../prisma/migrations/${m}/migration.sql`, import.meta.url),
          "utf8",
        ),
      );
    await db.account.createMany({
      data: [{ id: "owner" }, { id: "client" }, { id: "other" }],
    });
    await db.subscription.create({
      data: {
        ownerId: "owner",
        plan: "basic",
        provider: "stripe",
        status: "active",
        paidUntil: new Date(Date.now() + 30 * 86400000),
      },
    });
    const business = await db.$transaction((tx) =>
      createEstablishment(tx, "owner", {
        name: "Studio Aurora",
        slug: "studio-aurora",
        category: "Beleza",
        approvalMode: "manual",
        addressDetails: {
          postalCode: "01426-001",
          street: "Rua Oscar Freire",
          number: "525",
          neighborhood: "Cerqueira César",
          city: "São Paulo",
          state: "SP",
        },
      }),
    );
    assert.equal(business.published, false);
    assert.equal((await setupState(db, business.id, "owner")).ready, false);
    await assert.rejects(setupState(db, business.id, "other"), /FORBIDDEN/);
    const schedule = emptyWeeklySchedule();
    schedule.days.forEach((d) => {
      d.enabled = true;
      d.intervals = [{ start: "00:00", end: "23:59" }];
    });
    const pro = await db.$transaction((tx) =>
      createProfessional(tx, "owner", {
        establishmentId: business.id,
        name: "Ana",
        days: schedule.days,
      }),
    );
    const service = await db.$transaction((tx) =>
      createService(tx, "owner", {
        establishmentId: business.id,
        name: "Corte",
        professionalIds: [pro.id],
        durationMinutes: 30,
        stepMinutes: 30,
        priceCents: 5000,
      }),
    );
    assert.equal((await setupState(db, business.id, "owner")).ready, true);
    await assert.rejects(
      getAvailability(service.id, pro.id, undefined, db),
      /ESTABLISHMENT_FROZEN/,
    );
    await db.establishment.update({
      where: { id: business.id },
      data: { published: true },
    });
    const dates = await getAvailability(service.id, pro.id, undefined, db);
    const available = await getAvailability(
      service.id,
      pro.id,
      dates.dates[0],
      db,
    );
    assert.ok(available.slots.length > 0);
    const startsAt = new Date(available.slots[0].startsAt),
      endsAt = new Date(startsAt.getTime() + 1800000);
    const session = await db.session.create({
      data: {
        establishmentId: business.id,
        serviceId: service.id,
        professionalId: pro.id,
        startsAt,
        endsAt,
        occupiedStart: startsAt,
        occupiedEnd: endsAt,
        capacity: 1,
      },
    });
    const key = randomUUID();
    const rows = await db.$queryRaw<
      { id: string }[]
    >`SELECT reserve_session(${session.id}::uuid,'client',NULL,${key}::uuid) AS id`;
    const bookingId = rows[0].id;
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: bookingId } })).status,
      "pending",
    );
    assert.equal(await db.notification.count(), 2);
    await db.$queryRaw`SELECT reserve_session(${session.id}::uuid,'client',NULL,${key}::uuid)`;
    assert.equal(await db.notification.count(), 2);
    await db.booking.update({
      where: { id: bookingId },
      data: { status: "confirmed" },
    });
    await bookingReminders(db, "client");
    await bookingReminders(db, "client");
    assert.equal(
      await db.notification.count({
        where: { eventKey: `reminder:${bookingId}` },
      }),
      1,
    );
    const consumerNotice = await db.notification.findFirstOrThrow({
      where: { accountId: "client" },
    });
    await readNotifications(db, "other", [consumerNotice.id]);
    assert.equal(
      (
        await db.notification.findUniqueOrThrow({
          where: { id: consumerNotice.id },
        })
      ).readAt,
      null,
    );
    await readNotifications(db, "client", [consumerNotice.id]);
    assert.ok(
      (
        await db.notification.findUniqueOrThrow({
          where: { id: consumerNotice.id },
        })
      ).readAt,
    );
    const pastStart = new Date(Date.now() - 25 * 3600000),
      pastEnd = new Date(pastStart.getTime() + 1800000);
    await db.session.update({
      where: { id: session.id },
      data: {
        startsAt: pastStart,
        endsAt: pastEnd,
        occupiedStart: pastStart,
        occupiedEnd: pastEnd,
      },
    });
    const future = new Date();
    await completeOverdueBookings(db, future, { bookingId });
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: bookingId } }))
        .completedAutomatically,
      true,
    );
    const notifications = await db.notification.count();
    await completeOverdueBookings(db, future, { bookingId });
    assert.equal(await db.notification.count(), notifications);
    assert.equal(
      await db.notification.count({
        where: {
          accountId: "client",
          title: "Seu atendimento já pode ser avaliado",
        },
      }),
      1,
    );
    await db.$transaction((tx) =>
      createReview(
        tx,
        "client",
        { bookingId, establishmentScore: 4.5, serviceScore: 5 },
        future,
      ),
    );
    assert.equal(
      (await publicRatings([business.id], db)).get(business.id)?.rating,
      4.75,
    );
    await assert.rejects(
      db.$transaction((tx) =>
        createReview(
          tx,
          "client",
          { bookingId, establishmentScore: 5, serviceScore: 5 },
          future,
        ),
      ),
      /REVIEW_EXISTS/,
    );
  } finally {
    await db.$disconnect();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
