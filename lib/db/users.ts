import { ConflictError } from "@/lib/db/errors";
import { getPrisma } from "@/lib/db/prisma";
import type { BackendUser } from "@/types/backend";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

export function serializeUser(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: BackendUser["role"];
  status: BackendUser["status"];
  createdAt: Date;
}): BackendUser {
  return { ...user, createdAt: user.createdAt.toISOString() };
}

export async function findUserByEmail(email: string) {
  return getPrisma().user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function createUser(input: {
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
}) {
  const prisma = getPrisma();
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new ConflictError("An account with this email already exists.");

  return prisma.user.create({
    data: {
      email,
      name: input.name,
      phone: input.phone || null,
      passwordHash: input.passwordHash,
    },
    select: publicUserSelect,
  });
}

export async function getPublicUserById(id: string) {
  return getPrisma().user.findUnique({ where: { id }, select: publicUserSelect });
}
