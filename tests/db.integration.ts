import { markBookingArrival } from "../src/lib/booking-arrival";
import { editService } from "../src/lib/service-management";
import { emptyWeeklySchedule } from "../src/lib/weekly-schedule";
import {
  availabilityWindows,
  isWithinAvailability,
} from "../src/lib/weekly-availability";
import {
  updateProfessionalStatus,
  editProfessional,
  deleteProfessional,
} from "../src/lib/professional-management";
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
  professionalPhotoId,
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
    const photo = await orm.professionalPhoto.create({
      data: {
        ownerId: "owner",
        establishmentId: e,
        url: "https://example.test/professional.webp",
        key: randomUUID(),
      },
    });
    await assert.rejects(
      orm.$transaction((tx) => professionalPhotoId(tx, "a", e, photo.id)),
      /INVALID_INPUT/,
    );
    await assert.rejects(
      orm.$transaction((tx) =>
        professionalPhotoId(tx, "owner", randomUUID(), photo.id),
      ),
      /INVALID_INPUT/,
    );
    const withPhoto = await orm.$transaction((tx) =>
      createProfessional(tx, "owner", {
        establishmentId: e,
        name: "Photo Professional",
        photoId: photo.id,
      }),
    );
    assert.equal(withPhoto.photoId, photo.id);
    await assert.rejects(
      orm.$transaction((tx) => professionalPhotoId(tx, "owner", e, photo.id)),
      /INVALID_INPUT/,
    );
    await orm.professional.delete({ where: { id: withPhoto.id } });
    await orm.professionalPhoto.delete({ where: { id: photo.id } });
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
    // Status changes are authorized, retain history and protect direct SQL reservations.
    const managed = await orm.$transaction((tx) =>
      createProfessional(tx, "owner", {
        establishmentId: e,
        name: "Managed Professional",
      }),
    );
    await pool.query(
      "INSERT INTO professional_services(establishment_id,professional_id,service_id) VALUES($1,$2,$3)",
      [e, managed.id, v],
    );
    const managedStart = new Date(Date.now() + 4 * 86400000),
      managedEnd = new Date(managedStart.getTime() + 3600000);
    await orm.availabilityWindow.create({
      data: {
        professionalId: managed.id,
        startsAt: new Date(Date.now() + 3600000),
        endsAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    const managedSession = await orm.session.create({
      data: {
        establishmentId: e,
        professionalId: managed.id,
        serviceId: v,
        startsAt: managedStart,
        endsAt: managedEnd,
        occupiedStart: managedStart,
        occupiedEnd: managedEnd,
        capacity: 2,
      },
    });
    const managedIndividual = await orm.$transaction((tx) =>
      createService(tx, "owner", {
        establishmentId: e,
        name: "Vacation Individual",
        durationMinutes: 30,
        stepMinutes: 30,
        priceCents: 0,
        professionalIds: [managed.id],
        kind: "individual",
        modality: "in_person",
      }),
    );
    const managedDay = dayKey(managedStart, "America/Sao_Paulo");
    await assert.rejects(
      orm.$transaction((tx) =>
        updateProfessionalStatus(tx, "a", e, managed.id, {
          status: "inactive",
        }),
      ),
      /FORBIDDEN/,
    );
    await orm.$transaction((tx) =>
      updateProfessionalStatus(tx, "owner", e, managed.id, {
        status: "vacation",
        start: managedDay,
        end: dayKey(managedEnd, "America/Sao_Paulo"),
      }),
    );
    assert.equal(
      (await getAvailability(v, managed.id, managedDay, orm)).slots.length,
      0,
    );
    assert.equal(
      (await getAvailability(managedIndividual.id, managed.id, managedDay, orm))
        .slots.length,
      0,
    );
    await assert.rejects(
      pool.query("SELECT reserve_session($1,$2,NULL,$3)", [
        managedSession.id,
        "e",
        randomUUID(),
      ]),
      /PROFESSIONAL_UNAVAILABLE/,
    );
    await orm.$transaction((tx) =>
      updateProfessionalStatus(tx, "owner", e, managed.id, {
        status: "active",
      }),
    );
    assert.equal(
      (await getAvailability(v, managed.id, managedDay, orm)).slots.length,
      1,
    );
    await orm.$transaction((tx) =>
      updateProfessionalStatus(tx, "owner", e, managed.id, {
        status: "inactive",
      }),
    );
    await assert.rejects(
      getAvailability(v, managed.id, managedDay, orm),
      /SERVICE_UNAVAILABLE/,
    );
    await orm.$transaction((tx) =>
      updateProfessionalStatus(tx, "owner", e, managed.id, {
        status: "active",
      }),
    );
    const managedBooking = (
      await pool.query("SELECT reserve_session($1,$2,NULL,$3) AS id", [
        managedSession.id,
        "e",
        randomUUID(),
      ])
    ).rows[0].id;
    await assert.rejects(
      orm.$transaction((tx) => deleteProfessional(tx, "owner", e, managed.id)),
      /PROFESSIONAL_HAS_BOOKINGS/,
    );
    await assert.rejects(
      orm.$transaction((tx) =>
        updateProfessionalStatus(tx, "owner", e, managed.id, {
          status: "vacation",
          start: managedDay,
          end: dayKey(managedEnd, "America/Sao_Paulo"),
        }),
      ),
      /VACATION_BOOKINGS_CONFLICT/,
    );
    await orm.booking.update({
      where: { id: managedBooking },
      data: { status: "canceled" },
    });
    await assert.rejects(
      orm.$transaction((tx) =>
        editProfessional(tx, "owner", e, managed.id, {
          name: "Should roll back",
          status: "inactive",
          photoId: randomUUID(),
        }),
      ),
      /INVALID_INPUT/,
    );
    const unchanged = await orm.professional.findUniqueOrThrow({
      where: { id: managed.id },
    });
    assert.equal(unchanged.active, true);
    assert.equal(unchanged.name, "Managed Professional");
    const managedPhoto = await orm.professionalPhoto.create({
      data: {
        ownerId: "owner",
        establishmentId: e,
        url: "https://example.test/edited.webp",
        key: randomUUID(),
      },
    });
    await orm.$transaction((tx) =>
      editProfessional(tx, "owner", e, managed.id, {
        name: "Edited Professional",
        status: "inactive",
        photoId: managedPhoto.id,
      }),
    );
    const editedProfessional = await orm.professional.findUniqueOrThrow({
      where: { id: managed.id },
    });
    assert.equal(editedProfessional.name, "Edited Professional");
    assert.equal(editedProfessional.active, false);
    assert.equal(editedProfessional.photoId, managedPhoto.id);
    await assert.rejects(
      orm.$transaction((tx) =>
        editProfessional(tx, "a", e, managed.id, { name: "Unauthorized" }),
      ),
      /FORBIDDEN/,
    );
    await orm.$transaction((tx) =>
      deleteProfessional(tx, "owner", e, managed.id),
    );
    assert.ok(
      (await orm.professional.findUniqueOrThrow({ where: { id: managed.id } }))
        .deletedAt,
    );
    assert.ok(await orm.booking.findUnique({ where: { id: managedBooking } }));
    await assert.rejects(
      orm.$transaction((tx) =>
        updateProfessionalStatus(tx, "owner", e, managed.id, {
          status: "active",
        }),
      ),
      /FORBIDDEN/,
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
      where: {
        establishmentId: e,
        id: { not: p },
        active: true,
        deletedAt: null,
      },
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
    // Weekly rules keep generating local-time windows months later and protect reservations.
    const weekly = emptyWeeklySchedule();
    weekly.days[0].enabled = true;
    weekly.days[0].intervals = [
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "18:00" },
    ];
    const weeklyProfessional = await orm.professional.create({
      data: { establishmentId: e, name: "Weekly", weeklySchedule: weekly },
    });
    const farMonday = new Date(Date.now() + 56 * 86400000);
    while (farMonday.getUTCDay() !== 1)
      farMonday.setUTCDate(farMonday.getUTCDate() + 1);
    const monday = farMonday.toISOString().slice(0, 10);
    const weekEnd = new Date(farMonday.getTime() + 6 * 86400000)
      .toISOString()
      .slice(0, 10);
    const weeklyWindows = await availabilityWindows(
      orm,
      weeklyProfessional.id,
      monday,
      weekEnd,
    );
    assert.equal(weeklyWindows.length, 2);
    const timezone = (
      await orm.establishment.findUniqueOrThrow({ where: { id: e } })
    ).timezone;
    assert.equal(dayKey(weeklyWindows[0].startsAt, timezone), monday);
    assert.equal(
      new Intl.DateTimeFormat("pt-BR", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
      }).format(weeklyWindows[0].startsAt),
      "09:00",
    );
    await orm.professionalService.create({
      data: {
        establishmentId: e,
        professionalId: weeklyProfessional.id,
        serviceId: individual.id,
      },
    });
    const weeklyPublic = await getAvailability(
      individual.id,
      weeklyProfessional.id,
      monday,
      orm,
    );
    assert.ok(weeklyPublic.dates.includes(monday));
    assert.ok(weeklyPublic.slots.length > 0);
    assert.ok(
      weeklyPublic.dates.every(
        (date) => new Date(date + "T12:00:00Z").getUTCDay() === 1,
      ),
    );
    const weeklyStart = weeklyWindows[0].startsAt;
    const weeklyEnd = new Date(weeklyStart.getTime() + 3600000);
    assert.equal(
      await isWithinAvailability(
        orm,
        weeklyProfessional.id,
        weeklyStart,
        weeklyEnd,
      ),
      true,
    );
    assert.equal(
      await isWithinAvailability(
        orm,
        weeklyProfessional.id,
        new Date(weeklyWindows[0].endsAt.getTime() - 1800000),
        new Date(weeklyWindows[1].startsAt.getTime() + 1800000),
      ),
      false,
    );
    await orm.professionalService.create({
      data: {
        establishmentId: e,
        professionalId: weeklyProfessional.id,
        serviceId: v,
      },
    });
    const weeklySession = await orm.session.create({
      data: {
        establishmentId: e,
        professionalId: weeklyProfessional.id,
        serviceId: v,
        startsAt: weeklyStart,
        endsAt: weeklyEnd,
        occupiedStart: weeklyStart,
        occupiedEnd: weeklyEnd,
        capacity: 2,
      },
    });
    await pool.query("SELECT reserve_session($1,$2,NULL,$3)", [
      weeklySession.id,
      "a",
      randomUUID(),
    ]);
    // A saved closed week overrides legacy windows, without canceling an existing booking.
    await orm.availabilityWindow.create({
      data: {
        professionalId: weeklyProfessional.id,
        startsAt: weeklyStart,
        endsAt: weeklyEnd,
      },
    });
    await orm.professional.update({
      where: { id: weeklyProfessional.id },
      data: { weeklySchedule: emptyWeeklySchedule() },
    });
    assert.equal(
      await isWithinAvailability(
        orm,
        weeklyProfessional.id,
        weeklyStart,
        weeklyEnd,
      ),
      false,
    );
    await assert.rejects(
      pool.query("SELECT reserve_session($1,$2,NULL,$3)", [
        weeklySession.id,
        "b",
        randomUUID(),
      ]),
      /OUTSIDE_AVAILABILITY/,
    );
    assert.equal(
      await orm.booking.count({
        where: {
          sessionId: weeklySession.id,
          status: { in: ["confirmed", "pending"] },
        },
      }),
      1,
    );
    const editable = await orm.$transaction((tx) =>
      createService(tx, "owner", {
        establishmentId: e,
        name: "Edit test",
        durationMinutes: 30,
        stepMinutes: 30,
        bufferBefore: 0,
        bufferAfter: 0,
        priceCents: 1000,
        kind: "individual",
        modality: "in_person",
        professionalIds: [p],
      }),
    );
    const editInput = {
      establishmentId: e,
      name: "Updated service",
      durationMinutes: 45,
      stepMinutes: 15,
      bufferBefore: 5,
      bufferAfter: 10,
      price: "55,00",
      free: false,
      kind: "collective",
      modality: "online",
      professionalIds: [p],
    };
    await assert.rejects(
      orm.$transaction((tx) =>
        editService(tx, "nonexistent-user", editable.id, editInput),
      ),
      /FORBIDDEN/,
    );
    const edited = await orm.$transaction((tx) =>
      editService(tx, "owner", editable.id, editInput),
    );
    assert.equal(edited.name, "Updated service");
    assert.equal(edited.priceCents, 5500);
    assert.equal(edited.durationMinutes, 45);
    assert.equal(edited.kind, "collective");
    assert.equal(edited.modality, "online");
    assert.equal(edited.stepMinutes, 15);
    assert.equal(edited.bufferBefore, 5);
    assert.equal(edited.bufferAfter, 10);
    await assert.rejects(
      orm.$transaction((tx) =>
        editService(tx, "owner", editable.id, {
          ...editInput,
          professionalIds: [],
        }),
      ),
    );
    await orm.$transaction((tx) =>
      editService(tx, "owner", editable.id, {
        ...editInput,
        free: true,
        professionalIds: [weeklyProfessional.id],
      }),
    );
    assert.equal(
      await orm.professionalService.count({
        where: { serviceId: editable.id, professionalId: p },
      }),
      0,
    );
    assert.equal(
      await orm.professionalService.count({
        where: {
          serviceId: editable.id,
          professionalId: weeklyProfessional.id,
        },
      }),
      1,
    );
    assert.equal(
      (await orm.service.findUniqueOrThrow({ where: { id: editable.id } }))
        .priceCents,
      0,
    );
    const arrivalBooking = await orm.booking.findFirstOrThrow({
      include: { session: true },
      where: {
        status: "confirmed",
        session: { active: true, endsAt: { gt: new Date() } },
      },
    });
    await assert.rejects(
      orm.$transaction((tx) =>
        markBookingArrival(tx, "nonexistent-user", arrivalBooking.id),
      ),
      /FORBIDDEN/,
    );
    await assert.rejects(
      orm.$transaction((tx) =>
        markBookingArrival(tx, arrivalBooking.consumerId, arrivalBooking.id),
      ),
      /FORBIDDEN/,
    );
    await orm.$transaction((tx) =>
      markBookingArrival(
        tx,
        "owner",
        arrivalBooking.id,
        new Date(arrivalBooking.session.startsAt.getTime() - 3600000),
      ),
    );
    const arrival = await orm.booking.findUniqueOrThrow({
      where: { id: arrivalBooking.id },
    });
    assert.ok(arrival.arrivedAt);
    assert.equal(arrival.status, "confirmed");
    await orm.$transaction((tx) =>
      markBookingArrival(tx, "owner", arrivalBooking.id),
    );
    assert.equal(
      (
        await orm.booking.findUniqueOrThrow({ where: { id: arrival.id } })
      ).arrivedAt?.getTime(),
      arrival.arrivedAt.getTime(),
    );
    assert.equal(
      await orm.auditEvent.count({
        where: { bookingId: arrival.id, action: "booking.arrived" },
      }),
      1,
    );
    await assert.rejects(
      orm.$transaction((tx) =>
        markBookingArrival(tx, "owner", bReservation.id),
      ),
      /BOOKING_CLOSED/,
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
