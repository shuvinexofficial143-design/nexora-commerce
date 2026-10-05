import { timingSafeEqual } from "node:crypto";
import { hashPassword } from "@/lib/auth/password";
import { getPrisma } from "@/lib/db/prisma";

export const OWNER_ADMIN_COOKIE = "nexora_owner_admin";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function ownerAdminConfigured() {
  return Boolean(process.env.ADMIN_USERNAME?.trim() && process.env.ADMIN_PASSWORD);
}

export function verifyOwnerCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME?.trim() ?? "";
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!expectedUsername || !expectedPassword) return false;

  return safeEqual(username.trim(), expectedUsername) && safeEqual(password, expectedPassword);
}

export async function ensureOwnerAdminUser() {
  const prisma = getPrisma();
  const username = process.env.ADMIN_USERNAME?.trim() || "owner";
  const email = (process.env.ADMIN_OWNER_EMAIL?.trim() || "owner@nexora.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "ADMIN" || existing.status !== "ACTIVE") {
      return prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", status: "ACTIVE", name: username },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      email,
      name: username,
      passwordHash: await hashPassword(password || crypto.randomUUID()),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
}
