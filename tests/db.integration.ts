import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  createEstablishment,
  createProfessional,
  createService,
} from "../src/lib/business-write";
import { getAvailability } from "../src/lib/availability";
import { dayKey } from "../src/lib/format";
import { upcomingBookings } from "../src/lib/upcoming-bookings";
import { createReview } from "../src/lib/reviews";
import { publicRatings } from "../src/lib/public-ratings";

test("PostgreSQL prevents overlapping sessions and overselling concurrent bookings", async () => {
  // Isolated schema in the explicitly local Docker database. Never use production.
  const connectionString =
    "postgresql://flow:flow_local_only@127.0.0.1:5433/flow";
  const schema = `flow_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString, max: 1 });
  const pool = new Pool({
    connectionString,
    max: 6,
    options: `-c search_path=${schema},public`,
  });
  const orm = new PrismaClient({
    adapter: new PrismaPg(
      {
        connectionString,
        options: `-c search_path=${schema},public`,
      },
      { schema },
    ),
  });
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    for (const migration of (
      await readdir(new URL("../prisma/migrations/", import.meta.url))
    )
      .filter((name) => /^\d/.test(name))
      .sort())
      await pool.query(
        await readFile(
          new URL(
            `../prisma/migrations/${migration}/migration.sql`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
    await pool.query(
      "INSERT INTO accounts(id) VALUES('owner'),('a'),('b'),('c'),('d'),('e')",
    );
    await pool.query(
      "INSERT INTO subscriptions(owner_id,plan,status,paid_until) VALUES('owner','basic','active',now()+interval '30 days')",
    );
    const e = (
      await pool.query(
        "INSERT INTO establishments(owner_id,slug,name) VALUES('owner','test-flow','Test Flow') RETURNING id",
      )
    ).rows[0].id;
    const p = (
      await pool.query(
        "INSERT INTO professionals(establishment_id,name) VALUES($1,'Test Professional') RETURNING id",
        [e],
      )
    ).rows[0].id;
    const v = (
      await pool.query(
        "INSERT INTO services(establishment_id,name,duration_minutes,price_cents,modality,kind) VALUES($1,'Test Yoga',60,0,'in_person','collective') RETURNING id",
        [e],
      )
    ).rows[0].id;
    await pool.query(
      "INSERT INTO professional_services(establishment_id,professional_id,service_id) VALUES($1,$2,$3)",
      [e, p, v],
    );
    const typedService = await orm.service.findUnique({
      where: { id: v },
      include: { professionals: { include: { professional: true } } },
    });
    assert.equal(
      typedService?.professionals[0].professional.name,
      "Test Professional",
    );
    await pool.query(
      "INSERT INTO availability_windows(professional_id,starts_at,ends_at) VALUES($1,now()+interval '1 hour',now()+interval '7 days')",
      [p],
    );
    const session = (
      await pool.query(
        "INSERT INTO sessions(establishment_id,professional_id,service_id,starts_at,ends_at,occupied_start,occupied_end,capacity) VALUES($1,$2,$3,now()+interval '2 days',now()+interval '2 days 1 hour',now()+interval '2 days',now()+interval '2 days 1 hour',2) RETURNING id",
        [e, p, v],
      )
    ).rows[0].id;
    await assert.rejects(
      pool.query(
        "INSERT INTO sessions(establishment_id,professional_id,service_id,starts_at,ends_at,occupied_start,occupied_end,capacity) SELECT establishment_id,professional_id,service_id,starts_at,ends_at,occupied_start,occupied_end,capacity FROM sessions WHERE id=$1",
        [session],
      ),
      (error: unknown) => (error as { code: string }).code === "23P01",
    );
    const attempts = await Promise.allSettled(
      ["a", "b", "c", "d", "e"].map((id) =>
        pool.query("SELECT reserve_session($1,$2,NULL,$3) AS id", [
          session,
          id,
          randomUUID(),
        ]),
      ),
    );
    assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 2);
    assert.equal(attempts.filter((r) => r.status === "rejected").length, 3);
    assert.equal(
      Number(
        (
          await pool.query(
            "SELECT count(*) FROM bookings WHERE session_id=$1 AND status='confirmed'",
            [session],
          )
        ).rows[0].count,
      ),
      2,
    );
    const manual = (
      await pool.query(
        "INSERT INTO sessions(establishment_id,professional_id,service_id,starts_at,ends_at,occupied_start,occupied_end,capacity) VALUES($1,$2,$3,now()+interval '3 days',now()+interval '3 days 1 hour',now()+interval '3 days',now()+interval '3 days 1 hour',1) RETURNING id",
        [e, p, v],
      )
    ).rows[0].id;
    await pool.query(
      "UPDATE establishments SET approval_mode='manual' WHERE id=$1",
      [e],
    );
    const key = randomUUID();
    const reservation = (
      await pool.query("SELECT reserve_session($1,$2,NULL,$3) AS id", [
        manual,
        "a",
        key,
      ])
    ).rows[0].id;
    const repeat = (
      await pool.query("SELECT reserve_session($1,$2,NULL,$3) AS id", [
        manual,
        "a",
        key,
      ])
    ).rows[0].id;
    assert.equal(repeat, reservation);
    const expiry = (
      await pool.query(
        "SELECT expires_at-created_at AS interval,extract(epoch from(expires_at-created_at)) AS seconds FROM bookings WHERE id=$1",
        [reservation],
      )
    ).rows[0];
    assert.ok(
      Number(expiry.seconds) <= 86400 && Number(expiry.seconds) > 86300,
    );
    await assert.rejects(
      pool.query("SELECT reserve_session($1,$2,NULL,$3)", [
        manual,
        "b",
        randomUUID(),
      ]),
      /SESSION_FULL/,
    );
    await pool.query(
      "UPDATE bookings SET expires_at=now()-interval '1 minute' WHERE id=$1",
      [reservation],
    );
    await pool.query("SELECT reserve_session($1,$2,NULL,$3)", [
      manual,
      "b",
      randomUUID(),
    ]);
    assert.equal(
      (
        await pool.query("SELECT status FROM bookings WHERE id=$1", [
          reservation,
        ])
      ).rows[0].status,
      "expired",
    );
    await assert.rejects(
      orm.$transaction((tx) =>
        createEstablishment(tx, "owner", {
          name: "Another",
          slug: "another-test",
          category: "Beleza",
        }),
      ),
      /PLAN_LIMIT/,
    );
    for (let i = 1; i < 10; i++)
      await orm.$transaction((tx) =>
        createProfessional(tx, "owner", {
          establishmentId: e,
          name: `Professional ${i}`,
        }),
      );
    await assert.rejects(
      orm.$transaction((tx) =>
        createProfessional(tx, "owner", {
          establishmentId: e,
          name: "Eleventh",
        }),
      ),
      /PROFESSIONAL_LIMIT/,
    );
    await pool.query(
      "UPDATE subscriptions SET plan='multi' WHERE owner_id='owner'",
    );
    for (let i = 10; i < 20; i++)
      await orm.$transaction((tx) =>
        createProfessional(tx, "owner", {
          establishmentId: e,
          name: `Pro professional ${i}`,
        }),
      );
    await assert.rejects(
      orm.$transaction((tx) =>
        createProfessional(tx, "owner", {
          establishmentId: e,
          name: "Twenty-first",
        }),
      ),
      /PROFESSIONAL_LIMIT/,
    );
    await pool.query(
      "UPDATE subscriptions SET plan='basic' WHERE owner_id='owner'",
    );
    await assert.rejects(
      orm.$transaction((tx) =>
        createProfessional(tx, "owner", {
          establishmentId: e,
          name: "Over basic limit",
        }),
      ),
      /PROFESSIONAL_LIMIT/,
    );
    const individual = await orm.$transaction((tx) =>
      createService(tx, "owner", {
        establishmentId: e,
        name: "Individual",
        durationMinutes: 45,
        stepMinutes: 15,
        priceCents: 0,
        professionalIds: [p],
        kind: "individual",
        modality: "online",
        bufferAfter: 15,
      }),
    );
    const day = dayKey(
      new Date(Date.now() + 2 * 86400000),
      "America/Sao_Paulo",
    );
    const available = await getAvailability(individual.id, p, day, orm);
    assert.ok(available.dates.includes(day));
    assert.ok(available.slots.length > 0);
    const secondProfessional = await orm.professional.findFirstOrThrow({
      where: { establishmentId: e, id: { not: p } },
    });
    await orm.professionalService.create({
      data: {
        establishmentId: e,
        professionalId: secondProfessional.id,
        serviceId: individual.id,
      },
    });
    const target = new Date(available.slots[0].startsAt);
    const targetEnd = new Date(target.getTime() + 45 * 60000);
    await orm.availabilityWindow.create({
      data: {
        professionalId: secondProfessional.id,
        startsAt: new Date(target.getTime() - 3600000),
        endsAt: new Date(targetEnd.getTime() + 3600000),
      },
    });
    const otherSession = await orm.session.create({
      data: {
        establishmentId: e,
        professionalId: secondProfessional.id,
        serviceId: individual.id,
        startsAt: target,
        endsAt: targetEnd,
        occupiedStart: target,
        occupiedEnd: targetEnd,
        capacity: 1,
      },
    });
    const otherBooking = await orm.booking.create({
      data: {
        sessionId: otherSession.id,
        consumerId: "a",
        status: "pending",
        expiresAt: new Date(Date.now() + 3600000),
        priceCents: 0,
        durationMinutes: 45,
        idempotencyKey: randomUUID(),
      },
    });
    for (const status of ["pending", "confirmed"]) {
      await orm.booking.update({
        where: { id: otherBooking.id },
        data: { status },
      });
      const personal = await getAvailability(individual.id, p, day, orm, "a");
      assert.ok(
        !personal.slots.some((slot) => slot.startsAt === target.toISOString()),
        "consumer overlap must be hidden across professionals",
      );
      const publicSlots = await getAvailability(individual.id, p, day, orm);
      assert.ok(
        publicSlots.slots.some(
          (slot) => slot.startsAt === target.toISOString(),
        ),
        "another professional remains available to other consumers",
      );
      const occupiedProfessional = await getAvailability(
        individual.id,
        secondProfessional.id,
        day,
        orm,
      );
      assert.ok(
        !occupiedProfessional.slots.some(
          (slot) => slot.startsAt === target.toISOString(),
        ),
        "pending and confirmed reservations block their professional for everyone",
      );
    }
    await orm.booking.update({
      where: { id: otherBooking.id },
      data: { status: "pending", expiresAt: new Date(Date.now() - 1000) },
    });
    assert.ok(
      (await getAvailability(individual.id, p, day, orm, "a")).slots.some(
        (slot) => slot.startsAt === target.toISOString(),
      ),
      "expired pending reservations release consumer availability",
    );
    await orm.booking.update({
      where: { id: otherBooking.id },
      data: { status: "canceled" },
    });
    await orm.session.update({
      where: { id: otherSession.id },
      data: { active: false },
    });
    const occupied = (
      await pool.query(
        "SELECT occupied_start,occupied_end FROM sessions WHERE id=$1",
        [session],
      )
    ).rows[0];
    assert.ok(
      available.slots.every((s) => {
        const start = new Date(s.startsAt),
          end = new Date(start.getTime() + 3600000);
        return end <= occupied.occupied_start || start >= occupied.occupied_end;
      }),
    );
    const upcoming = await upcomingBookings("a", e, orm);
    const expected = (
      await pool.query(
        "SELECT id FROM bookings WHERE consumer_id='a' AND status IN ('confirmed','pending') AND (status<>'pending' OR expires_at>now())",
        [],
      )
    ).rows
      .map((r) => r.id)
      .sort();
    assert.deepEqual(upcoming.map((b) => b.id).sort(), expected);
    assert.ok(
      upcoming.every((b) => b.status === "confirmed" || b.status === "pending"),
    );
    assert.ok(!upcoming.some((b) => b.id === reservation));
    assert.deepEqual(await upcomingBookings("nonexistent-user", e, orm), []);
    assert.deepEqual(await upcomingBookings("a", randomUUID(), orm), []);
    const bReservation = await orm.booking.findFirstOrThrow({
      where: { consumerId: "b", sessionId: manual },
    });
    await orm.booking.update({
      where: { id: bReservation.id },
      data: { status: "canceled" },
    });
    assert.ok(
      !(await upcomingBookings("b", e, orm)).some(
        (b) => b.id === bReservation.id,
      ),
    );
    const reviewBooking = await orm.booking.findFirstOrThrow({
      where: { status: "confirmed" },
      include: { session: true },
    });
    const eligibleAt = new Date(
      reviewBooking.session.startsAt.getTime() + 24 * 3600000,
    );
    const reviewInput = {
      bookingId: reviewBooking.id,
      establishmentScore: 4.5,
      professionalScore: 3,
    };
    await assert.rejects(
      orm.$transaction((tx) =>
        createReview(tx, "nonexistent-user", reviewInput, eligibleAt),
      ),
      /FORBIDDEN/,
    );
    await assert.rejects(
      orm.$transaction((tx) =>
        createReview(
          tx,
          reviewBooking.consumerId,
          reviewInput,
          new Date(eligibleAt.getTime() - 1),
        ),
      ),
      /REVIEW_NOT_ELIGIBLE/,
    );
    await assert.rejects(
      orm.$transaction((tx) =>
        createReview(
          tx,
          "b",
          { ...reviewInput, bookingId: bReservation.id },
          new Date(eligibleAt.getTime() + 86400000),
        ),
      ),
      /REVIEW_NOT_ELIGIBLE/,
    );
    const reviewRace = await Promise.allSettled(
      [0, 1].map(() =>
        orm.$transaction((tx) =>
          createReview(tx, reviewBooking.consumerId, reviewInput, eligibleAt),
        ),
      ),
    );
    assert.equal(
      reviewRace.filter((result) => result.status === "fulfilled").length,
      1,
    );
    assert.equal(
      reviewRace.filter((result) => result.status === "rejected").length,
      1,
    );
    const aggregate = (await publicRatings([e], orm)).get(e);
    assert.equal(aggregate?.rating, 3.75);
    assert.equal(aggregate?.ratingCount, 1);
    await assert.rejects(
      pool.query(
        "INSERT INTO reviews(booking_id,establishment_score,professional_score) VALUES($1,11,0)",
        [bReservation.id],
      ),
      /check constraint/,
    );
    await pool.query(
      "UPDATE subscriptions SET paid_until=now()-interval '1 minute' WHERE owner_id='owner'",
    );
    await assert.rejects(
      pool.query("SELECT reserve_session($1,$2,NULL,$3)", [
        session,
        "e",
        randomUUID(),
      ]),
      /ESTABLISHMENT_FROZEN/,
    );
  } finally {
    await orm.$disconnect();
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
