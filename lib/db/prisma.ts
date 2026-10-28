import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { DatabaseNotConfiguredError } from "@/lib/db/errors";

type PrismaGlobal = typeof globalThis & {
  __nexoraPrisma?: PrismaClient;
  __nexoraPrismaConnection?: string;
};

const prismaGlobal = globalThis as PrismaGlobal;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new DatabaseNotConfiguredError();
  }

  if (prismaGlobal.__nexoraPrisma && prismaGlobal.__nexoraPrismaConnection === connectionString) {
    return prismaGlobal.__nexoraPrisma;
  }

  // Reuse one bounded connection pool per Node process, including production.
  // Without reuse, every API request would create another Pg pool until PostgreSQL rejects clients.
  const adapter = new PrismaPg({ connectionString, max: 5 });
  const client = new PrismaClient({ adapter });
  prismaGlobal.__nexoraPrisma = client;
  prismaGlobal.__nexoraPrismaConnection = connectionString;
  return client;
}
