import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  createEstablishment,
  businessBannerUrl,
  owned,
} from "../src/lib/business-write";
import { setFavorite } from "../src/lib/favorites";
test("business banners are owner scoped and favorites are persistent, isolated and idempotent", async () => {
  const connectionString =
    "postgresql://flow:flow_local_only@127.0.0.1:5433/flow";
  const schema = `flow_profile_${randomUUID().replaceAll("-", "")}`;
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
      .filter((n) => /^\d/.test(n))
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
    await db.account.createMany({ data: [{ id: "owner" }, { id: "other" }] });
    await db.subscription.create({
      data: {
        ownerId: "owner",
        plan: "basic",
        status: "active",
        paidUntil: new Date(Date.now() + 86400000),
      },
    });
    const banner = await db.businessBanner.create({
      data: {
        ownerId: "owner",
        url: "https://images.example/banner.webp",
        key: "banner",
      },
    });
    await assert.rejects(
      db.$transaction((tx) => businessBannerUrl(tx, "other", banner.id)),
      /INVALID_INPUT/,
    );
    const business = await db.$transaction((tx) =>
      createEstablishment(tx, "owner", {
        name: "Espaço Aurora",
        slug: "espaco-aurora",
        category: "Bem-estar",
        bannerId: banner.id,
        website: "aurora.com.br",
        instagram: "@aurora",
        contactPhone: "(11) 99999-9999",
      }),
    );
    assert.equal(business.published, false);
    await db.establishment.update({
      where: { id: business.id },
      data: { published: true },
    });
    assert.equal(business.coverUrl, banner.url);
    assert.equal(business.website, "https://aurora.com.br");
    assert.equal(business.instagram, "aurora");
    await assert.rejects(
      db.$transaction((tx) => owned(tx, "other", business.id)),
      /FORBIDDEN/,
    );
    await assert.rejects(
      db.$transaction((tx) =>
        createEstablishment(tx, "owner", {
          name: "Outro",
          slug: "outro",
          category: "Bem-estar",
        }),
      ),
      /PLAN_LIMIT/,
    );
    await db.$transaction((tx) =>
      setFavorite(tx, "client-a", business.id, true),
    );
    await db.$transaction((tx) =>
      setFavorite(tx, "client-a", business.id, true),
    );
    await db.$transaction((tx) =>
      setFavorite(tx, "client-b", business.id, true),
    );
    assert.equal(await db.favorite.count(), 2);
    await db.$transaction((tx) =>
      setFavorite(tx, "client-a", business.id, false),
    );
    assert.equal(
      await db.favorite.count({ where: { accountId: "client-b" } }),
      1,
    );
    assert.equal(
      await db.favorite.count({ where: { accountId: "client-a" } }),
      0,
    );
    await db.establishment.update({
      where: { id: business.id },
      data: { active: false },
    });
    await assert.rejects(
      db.$transaction((tx) => setFavorite(tx, "client-a", business.id, true)),
      /FORBIDDEN/,
    );
    await db.$transaction((tx) =>
      setFavorite(tx, "client-b", business.id, false),
    );
    assert.equal(await db.favorite.count(), 0);
  } finally {
    await db.$disconnect();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
