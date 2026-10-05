import { ConflictError, ValidationError } from "@/lib/db/errors";
import { hashPassword } from "@/lib/auth/password";
import { randomBytes } from "node:crypto";
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


export async function getOrCreateGuestCustomer(input: {
  email: string;
  name: string;
  phone?: string;
}) {
  const prisma = getPrisma();
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "CUSTOMER") {
      throw new ValidationError("Use a different checkout email address.");
    }

    if (existing.status !== "ACTIVE") {
      throw new ValidationError("This checkout email is not active.");
    }

    if (
      existing.name !== input.name.trim() ||
      (input.phone && existing.phone !== input.phone.trim())
    ) {
      return prisma.user.update({
        where: { id: existing.id },
        data: {
          name: input.name.trim() || existing.name,
          ...(input.phone ? { phone: input.phone.trim() } : {}),
        },
      });
    }

    return existing;
  }

  return prisma.user.create({
    data: {
      email,
      name: input.name.trim() || "Guest customer",
      phone: input.phone?.trim() || null,
      passwordHash: await hashPassword(randomBytes(32).toString("base64url")),
      role: "CUSTOMER",
      status: "ACTIVE",
    },
  });
}
