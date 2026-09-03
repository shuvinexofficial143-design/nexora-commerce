import { randomUUID } from "node:crypto";
import { getCurrentSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { getPrisma } from "@/lib/db/prisma";
import { createOrder, listOrdersForUser } from "@/lib/db/orders";
import { apiError, ok, validateOrder } from "@/lib/server/backend";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ ok: false, error: "Sign in required to view account orders." }, { status: 401 });
    return ok(await listOrdersForUser(session.user.id));
  } catch (error) {
    return apiError(error);
  }
}

async function getGuestCheckoutUser() {
  const email = "guest-checkout@prakritiganesh.local";
  const existing = await getPrisma().user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return existing;
  const passwordHash = await hashPassword(randomUUID());
  return getPrisma().user.create({
    data: { email, name: "Prakriti Ganesh Guest Checkout", passwordHash, role: "CUSTOMER", status: "ACTIVE" },
    select: { id: true },
  });
}

export async function POST(request: Request) {
  try {
    const payload = validateOrder(await request.json());
    const session = await getCurrentSession();
    const userId = session?.user.id ?? (await getGuestCheckoutUser()).id;
    const order = await createOrder(userId, payload);
    return ok(order, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
