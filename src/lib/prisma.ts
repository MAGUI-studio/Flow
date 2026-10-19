import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalPrisma = globalThis as unknown as {
  flowPrisma?: PrismaClient;
  flowPrismaConstructor?: typeof PrismaClient;
};
export function prisma() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  // Fast Refresh preserves globals, but a regenerated client has a new constructor.
  // Reusing the old instance would reject fields introduced by the new schema.
  if (
    process.env.NODE_ENV !== "production" &&
    globalPrisma.flowPrisma &&
    globalPrisma.flowPrismaConstructor !== PrismaClient
  ) {
    void globalPrisma.flowPrisma.$disconnect().catch(() => {});
    globalPrisma.flowPrisma = undefined;
  }
  globalPrisma.flowPrismaConstructor = PrismaClient;
  return (globalPrisma.flowPrisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  }));
}
