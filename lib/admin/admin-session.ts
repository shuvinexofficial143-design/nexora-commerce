import { createHash, randomBytes } from "node:crypto";
import { getPrisma } from "@/lib/db/prisma";
import { OWNER_ADMIN_COOKIE } from "@/lib/admin/owner-auth";

const ADMIN_SESSION_HOURS = 12;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) return token;

  const cookie = request.headers.get("cookie") ?? "";
  const ownerCookie = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${OWNER_ADMIN_COOKIE}=`));

  return ownerCookie ? decodeURIComponent(ownerCookie.slice(OWNER_ADMIN_COOKIE.length + 1)) : null;
}

export async function issueAdminToken(userId: string) {
  const token = randomBytes(40).toString("base64url");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000);

  await getPrisma().session.create({
    data: {
      tokenHash: tokenHash(token),
      userId,
      expiresAt,
    },
  });

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getAdminSession(request: Request) {
  const token = bearerToken(request);
  if (!token) return null;

  const session = await getPrisma().session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (
    session.expiresAt <= new Date() ||
    session.user.status !== "ACTIVE" ||
    session.user.role !== "ADMIN"
  ) {
    await getPrisma().session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return {
    id: session.id,
    expiresAt: session.expiresAt.toISOString(),
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  };
}

export async function revokeAdminToken(request: Request) {
  const token = bearerToken(request);
  if (!token) return;

  await getPrisma().session.deleteMany({
    where: { tokenHash: tokenHash(token) },
  });
}
