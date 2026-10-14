import { Pool } from "pg";
const globalDb = globalThis as unknown as { flowPool?: Pool };
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  return (globalDb.flowPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  }));
}
