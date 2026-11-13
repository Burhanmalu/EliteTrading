import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

// Clean connection URL for pg adapter (remove conflicting sslmode parameter so custom ssl options apply)
let rawUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_6aqhr5TjOCAW@127.0.0.1:5433/neondb?options=endpoint%3Dep-green-mouse-bd0m0n4p";

const cleanUrl = rawUrl.replace(/([?&])sslmode=[^&]+&?/g, "$1").replace(/[?&]$/, "");

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: cleanUrl,
    ssl: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    },
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
