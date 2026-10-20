import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  completeOverdueBookings,
  automaticCompletionDelay,
} from "../src/lib/booking-completion";
import { createReview } from "../src/lib/reviews";
import { publicRatings } from "../src/lib/public-ratings";

test("automatic completion respects the exact 24-hour boundary, terminal statuses, concurrency and review eligibility", async () => {
  const connectionString =
    "postgresql://flow:flow_local_only@127.0.0.1:5433/flow";
  const schema = `flow_completion_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString, max: 1 });
  const db = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString, options: `-c search_path=${schema},public` },
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
      await db.$executeRawUnsafe(
        await readFile(
          new URL(
            `../prisma/migrations/${migration}/migration.sql`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
    await db.account.createMany({ data: [{ id: "owner" }, { id: "client" }] });
    const establishment = await db.establishment.create({
      data: {
        ownerId: "owner",
        slug: "automatic-completion",
        name: "Automatic completion",
      },
    });
    const service = await db.service.create({
      data: {
        establishmentId: establishment.id,
        name: "Atendimento",
        durationMinutes: 60,
        priceCents: 5000,
        modality: "in_person",
        kind: "individual",
      },
    });
    const now = new Date();
    const cutoff = now.getTime() - automaticCompletionDelay;
    const cases = [
      { name: "exact", status: "confirmed", startsAt: new Date(cutoff) },
      { name: "older", status: "confirmed", startsAt: new Date(cutoff - 1) },
      { name: "not-yet", status: "confirmed", startsAt: new Date(cutoff + 1) },
      {
        name: "future",
        status: "confirmed",
        startsAt: new Date(now.getTime() + 3600000),
      },
      ...[
        "pending",
        "canceled",
        "declined",
        "expired",
        "no_show",
        "completed",
      ].map((status) => ({
        name: status,
        status,
        startsAt: new Date(cutoff - 86400000),
      })),
    ];
    const bookings = new Map<string, string>();
    for (const item of cases) {
      const professional = await db.professional.create({
        data: { establishmentId: establishment.id, name: item.name },
      });
      await db.professionalService.create({
        data: {
          establishmentId: establishment.id,
          serviceId: service.id,
          professionalId: professional.id,
        },
      });
      const end = new Date(item.startsAt.getTime() + 3600000);
      const session = await db.session.create({
        data: {
          establishmentId: establishment.id,
          serviceId: service.id,
          professionalId: professional.id,
          startsAt: item.startsAt,
          endsAt: end,
          occupiedStart: item.startsAt,
          occupiedEnd: end,
          capacity: 1,
        },
      });
      const booking = await db.booking.create({
        data: {
          sessionId: session.id,
          consumerId: "client",
          status: item.status,
          priceCents: 5000,
          durationMinutes: 60,
          expiresAt:
            item.status === "pending"
              ? new Date(now.getTime() - 3600000)
              : null,
          idempotencyKey: randomUUID(),
        },
      });
      bookings.set(item.name, booking.id);
    }
    assert.equal(
      await completeOverdueBookings(db, now, { consumerId: "another-client" }),
      0,
    );
    assert.equal(
      await completeOverdueBookings(db, now, { ownerId: "another-owner" }),
      0,
    );
    const concurrent = await Promise.all([
      completeOverdueBookings(db, now),
      completeOverdueBookings(db, now),
    ]);
    assert.equal(
      concurrent.reduce((total, count) => total + count, 0),
      2,
    );
    assert.equal(await completeOverdueBookings(db, now), 0);
    for (const item of cases) {
      const actual = await db.booking.findUniqueOrThrow({
        where: { id: bookings.get(item.name)! },
      });
      assert.equal(
        actual.status,
        ["exact", "older"].includes(item.name) ? "completed" : item.status,
        item.name,
      );
    }
    assert.equal(
      await db.auditEvent.count({
        where: { action: "booking.auto_completed" },
      }),
      2,
    );
    const exactId = bookings.get("exact")!;
    await db.$transaction((tx) =>
      createReview(
        tx,
        "client",
        { bookingId: exactId, establishmentScore: 5, serviceScore: 4 },
        now,
      ),
    );
    assert.equal(
      (await publicRatings([establishment.id], db)).get(establishment.id)
        ?.rating,
      4.5,
    );
    const later = new Date(now.getTime() + 1);
    const pendingId = bookings.get("not-yet")!;
    // Direct review submission also catches up without depending on the timer or a page visit.
    await db.$transaction((tx) =>
      createReview(
        tx,
        "client",
        { bookingId: pendingId, establishmentScore: 2.5, serviceScore: 3.5 },
        later,
      ),
    );
    assert.equal(
      (await db.booking.findUniqueOrThrow({ where: { id: pendingId } })).status,
      "completed",
    );
    assert.equal(
      await db.auditEvent.count({
        where: { bookingId: pendingId, action: "booking.auto_completed" },
      }),
      1,
    );
    const ratings = (await publicRatings([establishment.id], db)).get(
      establishment.id,
    );
    assert.equal(ratings?.rating, 3.75);
    assert.equal(ratings?.ratingCount, 2);
  } finally {
    await db.$disconnect();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
