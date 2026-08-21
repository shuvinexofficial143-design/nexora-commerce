import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { DatabaseNotConfiguredError } from "@/lib/db/errors";

type PrismaGlobal = typeof globalThis & {
  __nexoraPrisma?: PrismaClient;
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

  if (prismaGlobal.__nexoraPrisma) {
    return prismaGlobal.__nexoraPrisma;
  }

  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    prismaGlobal.__nexoraPrisma = client;
  }

  return client;
}
