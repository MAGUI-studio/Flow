import { test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

test("development replaces a client retained before schema regeneration, then reuses the new instance", async () => {
  const cache = globalThis as unknown as {
    flowPrisma?: PrismaClient;
    flowPrismaConstructor?: typeof PrismaClient;
  };
  const previous = {
    flowPrisma: cache.flowPrisma,
    flowPrismaConstructor: cache.flowPrismaConstructor,
  };
  const connection = process.env.DATABASE_URL;
  let disconnected = false;
  let client: PrismaClient | undefined;
  try {
    process.env.DATABASE_URL =
      connection ?? "postgresql://flow:flow_local_only@127.0.0.1:5433/flow";
    cache.flowPrisma = {
      $disconnect: async () => {
        disconnected = true;
      },
    } as unknown as PrismaClient;
    cache.flowPrismaConstructor = undefined;
    client = prisma();
    assert.equal(disconnected, true);
    assert.equal(client.professional.fields.deletedAt.name, "deletedAt");
    assert.equal(
      client.professional.fields.vacationStartsAt.name,
      "vacationStartsAt",
    );
    assert.equal(prisma(), client);
  } finally {
    await client?.$disconnect();
    cache.flowPrisma = previous.flowPrisma;
    cache.flowPrismaConstructor = previous.flowPrismaConstructor;
    if (connection === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = connection;
  }
});
