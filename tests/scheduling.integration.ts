import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { emptyWeeklySchedule } from "../src/lib/weekly-schedule";
import { reserve } from "../src/lib/reservations";
import { getAvailability } from "../src/lib/availability";
import {
  createBlock,
  requestReschedule,
  decideReschedule,
  saveCustomerNote,
  createSeries,
  replaceSeries,
} from "../src/lib/scheduling";
import {
  joinWaitlist,
  decideWaitlist,
  processScheduling,
} from "../src/lib/waitlist";

test("scheduling workflows preserve reservations, isolate notes, honor blocks, and hold waitlist capacity", async () => {
  const connectionString =
    "postgresql://flow:flow_local_only@127.0.0.1:5433/flow";
  const schema = "flow_scheduling_" + randomUUID().replaceAll("-", "");
  const admin = new Pool({ connectionString, max: 1 });
  const db = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, options: `-c search_path=${schema},public`, max: 5 },
      { schema },
    ),
  });
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    for (const name of (
      await readdir(new URL("../prisma/migrations/", import.meta.url))
    )
      .filter((n) => /^\d/.test(n))
      .sort())
      await db.$executeRawUnsafe(
        await readFile(
          new URL(
            `../prisma/migrations/${name}/migration.sql`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
    await db.account.createMany({
      data: ["owner", "client", "other", "outsider"].map((id) => ({ id })),
    });
    await db.subscription.create({
      data: {
        ownerId: "owner",
        plan: "multi",
        status: "active",
        paidUntil: new Date(Date.now() + 365 * 86400000),
      },
    });
    const e = await db.establishment.create({
      data: {
        ownerId: "owner",
        slug: "scheduling",
        name: "Studio Aurora",
        timezone: "UTC",
        cancelNoticeHours: 2,
      },
    });
    const schedule = emptyWeeklySchedule();
    schedule.days.forEach((d) => {
      d.enabled = true;
      d.intervals = [{ start: "08:00", end: "19:00" }];
    });
    const pro = await db.professional.create({
      data: { establishmentId: e.id, name: "Ana", weeklySchedule: schedule },
    });
    const service = await db.service.create({
      data: {
        establishmentId: e.id,
        name: "Corte",
        durationMinutes: 30,
        priceCents: 5000,
        modality: "in_person",
        kind: "individual",
      },
    });
    await db.professionalService.create({
      data: {
        establishmentId: e.id,
        professionalId: pro.id,
        serviceId: service.id,
      },
    });
    const day = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const at = (time: string) => new Date(`${day}T${time}:00Z`);
    const create = (consumerId: string, time: string) =>
      db.$transaction((tx) =>
        reserve(tx, {
          consumerId,
          serviceId: service.id,
          professionalId: pro.id,
          startsAt: at(time),
          phone: "(12) 98184-7553",
        }),
      );
    const original = await create("client", "09:00");
    // Blocks reveal conflicts, require explicit IDs, and remove availability for the entire establishment.
    const block = {
      establishmentId: e.id,
      professionalIds: [],
      fromDate: day,
      toDate: day,
      allDay: false,
      fromTime: "09:00",
      toTime: "10:00",
      reason: "Compromisso",
      cancelConflicts: false,
    };
    const conflict = await db.$transaction((tx) =>
      createBlock(tx, "owner", block),
    );
    assert.equal(conflict.conflicts.length, 1);
    assert.equal(await db.scheduleBlock.count(), 0);
    await assert.rejects(
      db.$transaction((tx) => createBlock(tx, "outsider", block)),
      /FORBIDDEN/,
    );
    const b = await db.$transaction((tx) =>
      createBlock(tx, "owner", {
        ...block,
        fromTime: "13:00",
        toTime: "14:00",
      }),
    );
    assert.ok("block" in b);
    const availability = await getAvailability(service.id, pro.id, day, db);
    assert.equal(
      availability.slots.some((s) => s.startsAt === at("13:00").toISOString()),
      false,
    );
    await assert.rejects(create("other", "13:00"), /SESSION_UNAVAILABLE/);
    // Automatic replacement commits the new booking and releases the old one together.
    const changed = await db.$transaction((tx) =>
      requestReschedule(tx, "client", original.id, {
        professionalId: pro.id,
        date: day,
        startsAt: at("10:00").toISOString(),
      }),
    );
    assert.equal(changed.pending, false);
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: original.id } }))
        .status,
      "canceled",
    );
    // Manual requests keep the original until an authorized decision; failures leave it untouched.
    await db.establishment.update({
      where: { id: e.id },
      data: { approvalMode: "manual" },
    });
    const target = await db.$transaction((tx) =>
      requestReschedule(tx, "client", changed.bookingId, {
        professionalId: pro.id,
        date: day,
        startsAt: at("11:00").toISOString(),
      }),
    );
    assert.equal(target.pending, true);
    const r = await db.rescheduleRequest.findFirstOrThrow({
      where: { targetBookingId: target.bookingId },
    });
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: changed.bookingId } }))
        .status,
      "confirmed",
    );
    await assert.rejects(
      db.$transaction((tx) => decideReschedule(tx, "outsider", r.id, true)),
      /FORBIDDEN/,
    );
    await db.$transaction((tx) => decideReschedule(tx, "owner", r.id, false));
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: changed.bookingId } }))
        .status,
      "confirmed",
    );
    const second = await db.$transaction((tx) =>
      requestReschedule(tx, "client", changed.bookingId, {
        professionalId: pro.id,
        date: day,
        startsAt: at("11:30").toISOString(),
      }),
    );
    const r2 = await db.rescheduleRequest.findFirstOrThrow({
      where: { targetBookingId: second.bookingId },
    });
    await db.$transaction((tx) => decideReschedule(tx, "owner", r2.id, true));
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: changed.bookingId } }))
        .status,
      "canceled",
    );
    const note = await db.$transaction((tx) =>
      saveCustomerNote(tx, "owner", {
        establishmentId: e.id,
        consumerId: "client",
        content: "Prefere horários pela manhã.",
      }),
    );
    await assert.rejects(
      db.$transaction((tx) =>
        saveCustomerNote(
          tx,
          "outsider",
          { establishmentId: e.id, consumerId: "client", content: "Alteração" },
          note.id,
        ),
      ),
      /FORBIDDEN/,
    );
    // Preview never creates bookings; series edits preview rolls back released slots.
    const seriesInput = {
      establishmentId: e.id,
      consumerId: "client",
      serviceId: service.id,
      professionalId: pro.id,
      fromDate: day,
      time: "15:00",
      intervalWeeks: 1,
      count: 3,
      phone: "(12) 98184-7553",
      excludedDates: [],
    };
    const before = await db.booking.count();
    const preview = await db.$transaction((tx) =>
      createSeries(tx, "owner", seriesInput, true),
    );
    assert.equal(preview.occurrences.length, 3);
    assert.equal(await db.booking.count(), before);
    const created = await db.$transaction((tx) =>
      createSeries(tx, "owner", seriesInput, false),
    );
    assert.ok("id" in created);
    const seriesId = (created as { id: string }).id;
    const first = await db.booking.findFirstOrThrow({
      where: { seriesId },
      include: { session: true },
      orderBy: { session: { startsAt: "asc" } },
    });
    await db.$transaction((tx) =>
      replaceSeries(
        tx,
        "owner",
        seriesId,
        first.id,
        { ...seriesInput, time: "16:00" },
        true,
      ),
    );
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: first.id } })).status,
      "confirmed",
    );
    await assert.rejects(
      db.$transaction((tx) =>
        replaceSeries(
          tx,
          "owner",
          seriesId,
          first.id,
          { ...seriesInput, time: "13:00" },
          false,
        ),
      ),
      /SERIES_CONFLICT/,
    );
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: first.id } })).status,
      "confirmed",
    );
    await db.$transaction((tx) =>
      replaceSeries(
        tx,
        "owner",
        seriesId,
        first.id,
        { ...seriesInput, time: "16:00" },
        false,
      ),
    );
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: first.id } })).status,
      "canceled",
    );
    // Offers reserve capacity, are account scoped and can be accepted or expire without confirming.
    await db.establishment.update({
      where: { id: e.id },
      data: { approvalMode: "automatic" },
    });
    const wait = {
      serviceId: service.id,
      professionalId: pro.id,
      fromDate: day,
      toDate: day,
      fromTime: "17:00",
      toTime: "17:30",
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      phone: "(12) 98184-7553",
    };
    const entry = await db.$transaction((tx) =>
      joinWaitlist(tx, "other", wait),
    );
    await assert.rejects(
      db.$transaction((tx) => joinWaitlist(tx, "other", wait)),
      /WAITLIST_DUPLICATE/,
    );
    await processScheduling(db);
    const offered = await db.waitlistEntry.findUniqueOrThrow({
      where: { id: entry.id },
    });
    assert.equal(offered.status, "offered");
    const offeredBooking = await db.booking.findUniqueOrThrow({
      where: { id: offered.offeredBookingId! },
      include: { session: true },
    });
    assert.equal(offeredBooking.status, "pending");
    await assert.rejects(
      db.$transaction((tx) => decideWaitlist(tx, "client", entry.id, true)),
      /FORBIDDEN/,
    );
    const accepts = await Promise.allSettled([
      db.$transaction((tx) => decideWaitlist(tx, "other", entry.id, true)),
      db.$transaction((tx) => decideWaitlist(tx, "other", entry.id, true)),
    ]);
    assert.equal(accepts.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: offeredBooking.id } }))
        .status,
      "confirmed",
    );
    // A later subscriber cannot take an offered slot; expiry releases it for the next in the queue.
    await assert.rejects(
      db.$transaction((tx) =>
        reserve(tx, {
          consumerId: "client",
          serviceId: service.id,
          professionalId: pro.id,
          startsAt: offeredBooking.session.startsAt,
          phone: "(12) 98184-7553",
        }),
      ),
      /SESSION_UNAVAILABLE/,
    );
    const waitNext = { ...wait, fromTime: "18:00", toTime: "18:30" };
    const queuedFirst = await db.$transaction((tx) =>
      joinWaitlist(tx, "client", waitNext),
    );
    const queuedSecond = await db.$transaction((tx) =>
      joinWaitlist(tx, "outsider", waitNext),
    );
    await processScheduling(db);
    const hold = await db.waitlistEntry.findUniqueOrThrow({
      where: { id: queuedFirst.id },
    });
    assert.equal(hold.status, "offered");
    assert.equal(
      (
        await db.waitlistEntry.findUniqueOrThrow({
          where: { id: queuedSecond.id },
        })
      ).status,
      "waiting",
    );
    await db.waitlistEntry.update({
      where: { id: hold.id },
      data: { offerExpiresAt: new Date(Date.now() - 1) },
    });
    await db.booking.update({
      where: { id: hold.offeredBookingId! },
      data: { expiresAt: new Date(Date.now() - 1) },
    });
    await processScheduling(db);
    assert.equal(
      (
        await db.waitlistEntry.findUniqueOrThrow({
          where: { id: queuedSecond.id },
        })
      ).status,
      "offered",
    );
    await db.$transaction((tx) =>
      decideWaitlist(tx, "outsider", queuedSecond.id, false),
    );
    assert.equal(
      (
        await db.waitlistEntry.findUniqueOrThrow({
          where: { id: queuedSecond.id },
        })
      ).status,
      "canceled",
    );
    // Expired reschedule requests never cancel their original booking.
    await db.establishment.update({
      where: { id: e.id },
      data: { approvalMode: "manual" },
    });
    const pendingMove = await db.$transaction((tx) =>
      requestReschedule(tx, "client", second.bookingId, {
        professionalId: pro.id,
        date: day,
        startsAt: at("12:00").toISOString(),
      }),
    );
    await db.rescheduleRequest.updateMany({
      where: { targetBookingId: pendingMove.bookingId },
      data: { expiresAt: new Date(Date.now() - 1) },
    });
    await processScheduling(db);
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: second.bookingId } }))
        .status,
      "confirmed",
    );
    assert.equal(
      (
        await db.booking.findUniqueOrThrow({
          where: { id: pendingMove.bookingId },
        })
      ).status,
      "expired",
    );
    // Concurrent writes cannot produce both a block and an active reservation in its interval.
    await Promise.allSettled([
      db.$transaction((tx) =>
        createBlock(tx, "owner", {
          ...block,
          fromTime: "08:00",
          toTime: "08:30",
        }),
      ),
      create("outsider", "08:00"),
    ]);
    const blocked = await db.scheduleBlock.count({
      where: { startsAt: at("08:00"), endsAt: at("08:30") },
    });
    const booked = await db.booking.count({
      where: {
        status: { in: ["confirmed", "pending"] },
        session: { startsAt: at("08:00") },
      },
    });
    assert.equal(blocked > 0 && booked > 0, false);
    // Explicit cancellation is the only way a conflicting block can remove existing bookings.
    const saved = await db.$transaction((tx) =>
      createBlock(tx, "owner", {
        ...block,
        fromTime: "11:30",
        toTime: "12:00",
      }),
    );
    assert.equal(saved.conflicts.length, 1);
    await db.$transaction((tx) =>
      createBlock(tx, "owner", {
        ...block,
        fromTime: "11:30",
        toTime: "12:00",
        cancelConflicts: true,
        conflictIds: saved.conflicts.map((b) => b.id),
      }),
    );
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: second.bookingId } }))
        .status,
      "canceled",
    );
  } finally {
    await db.$disconnect();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
