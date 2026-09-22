import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { createReturnForUser, listReturnsForUser } from "@/lib/db/customer-returns";
import { apiError, ok } from "@/lib/server/backend";
import { ValidationError } from "@/lib/db/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
    }

    return ok(await listReturnsForUser(session.user.id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const orderNumber = String(body.orderNumber ?? "").trim();
    const reason = String(body.reason ?? "").trim();
    const details = String(body.details ?? "").trim();

    if (!orderNumber) throw new ValidationError("Order number is required.");
    if (reason.length < 3) throw new ValidationError("Choose a return reason.");

    return ok(
      await createReturnForUser(session.user.id, {
        orderNumber,
        reason,
        details: details || undefined,
      }),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
