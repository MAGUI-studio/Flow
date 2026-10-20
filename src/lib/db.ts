import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
const globalDb = globalThis as unknown as { flowPool?: Pool };
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!globalDb.flowPool) {
    globalDb.flowPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });
    if (process.env.VERCEL === "1") attachDatabasePool(globalDb.flowPool);
  }
  return globalDb.flowPool;
}
