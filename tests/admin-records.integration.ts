import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { Pool } from "pg";
import { adminRecordSections } from "../src/lib/admin-records";
import { buildAdminRecordQuery, adminRecordDates } from "../src/lib/admin-record-filters";
import { adminFilterDefaults } from "../src/lib/admin-filters";

test("admin record queries validate against migrated PostgreSQL, include related data, and parameterize identity", async () => {
  const schema = `admin_test_${randomUUID().replaceAll("-", "")}`;
  const pool = new Pool({
    connectionString: "postgresql://flow:flow_local_only@127.0.0.1:5433/flow",
    max: 1,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`SET LOCAL search_path TO ${schema},public`);
    for (const name of (
      await readdir(new URL("../prisma/migrations/", import.meta.url))
    )
      .filter((n) => /^\d/.test(n))
      .sort()) {
      await client.query(
        (
          await readFile(
            new URL(
              `../prisma/migrations/${name}/migration.sql`,
              import.meta.url,
            ),
            "utf8",
          )
        ).replace(/^(?:BEGIN|COMMIT);[ \t]*\r?$/gm, ""),
      );
    }
    await client.query(
      "INSERT INTO accounts(id) VALUES ('admin_fixture_owner'),('admin_fixture_consumer'),('admin_fixture_other')",
    );
    await client.query(
      "INSERT INTO subscriptions(owner_id,plan,status,paid_until) VALUES('admin_fixture_owner','basic','active',now()+interval '30 days')",
    );
    const business = (
      await client.query(
        "INSERT INTO establishments(owner_id,name,slug) VALUES('admin_fixture_owner','Admin fixture','admin-fixture') RETURNING id",
      )
    ).rows[0].id;
    await client.query(
      "INSERT INTO customer_notes(establishment_id,consumer_id,content) VALUES($1,'admin_fixture_consumer','Observação operacional')",
      [business],
    );
    await client.query(
      "INSERT INTO favorites(account_id,establishment_id) VALUES('admin_fixture_consumer',$1)",
      [business],
    );
    for (const [name, definition] of Object.entries(adminRecordSections)) {
      for (const search of ["", "Observação operacional", "' OR 1=1 --", "%_"]) {
        const built = buildAdminRecordQuery(definition.query, name, "admin_fixture_consumer", { ...adminFilterDefaults, busca: search, ...(adminRecordDates[name] ? { de: "2000-01-01", ate: "2099-12-31" } : {}) }, 1);
        const filtered = await client.query(built.sql, built.values);
        const filteredCount = await client.query(built.count, built.countValues);
        assert.equal(filtered.rows.length, Number(filteredCount.rows[0].total));
        if (search.includes("OR 1=1") || search === "%_") assert.equal(filtered.rowCount, 0);
        if (name === "anotacoes" && search === "Observação operacional") assert.equal(filtered.rowCount, 1);
      }
      for (const identity of [
        "admin_fixture_owner",
        "admin_fixture_consumer",
        "admin_fixture_other",
        "' OR 1=1 --",
      ]) {
        const rows = await client.query(
          `${definition.query} LIMIT $2 OFFSET $3`,
          [identity, 25, 0],
        );
        const count = await client.query(
          `SELECT count(*)::int AS total FROM (${definition.query}) records`,
          [identity],
        );
        assert.equal(
          rows.rows.length,
          count.rows[0].total,
          `${name}: bounded fixture count`,
        );
        if (identity === "admin_fixture_other" || identity.includes("OR 1=1"))
          assert.equal(rows.rowCount, 0, `${name}: no unrelated records`);
        if (
          name === "anotacoes" &&
          identity !== "admin_fixture_other" &&
          !identity.includes("OR 1=1")
        )
          assert.equal(rows.rowCount, 1);
        if (name === "estabelecimentos" && identity === "admin_fixture_owner")
          assert.equal(rows.rowCount, 1);
        if (name === "favoritos" && identity === "admin_fixture_consumer")
          assert.equal(rows.rowCount, 1);
        for (const row of rows.rows)
          for (const key of Object.keys(row))
            assert.doesNotMatch(key, /attendance_hash|token|password|secret/i);
      }
    }
  } finally {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});
