import { NextResponse } from "next/server";
import { multiVendorEnabled } from "@/lib/config/features";
import { getCurrentSession } from "@/lib/auth/session";
import { advanceSellerOrder } from "@/lib/db/seller-commerce";
import { apiError, ok } from "@/lib/server/backend";

export const runtime = "nodejs";

async function requireSeller() {
  if (!multiVendorEnabled()) {
    return {
      session: null,
      response: NextResponse.json(
        { ok: false, error: "Seller workspace is disabled for this store." },
        { status: 404 },
      ),
    };
  }

  const session = await getCurrentSession();

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { ok: false, error: "Sign in required." },
        { status: 401 },
      ),
    };
  }

  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    return {
      session: null,
      response: NextResponse.json(
        { ok: false, error: "Seller access required." },
        { status: 403 },
      ),
    };
  }

  return { session, response: null };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const auth = await requireSeller();
    if (!auth.session) return auth.response;

    const { orderNumber } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const status = body.status;

    if (status !== "Processing" && status !== "Packed" && status !== "Shipped") {
      return NextResponse.json(
        { ok: false, error: "Invalid seller order status." },
        { status: 400 },
      );
    }

    return ok(
      await advanceSellerOrder(
        auth.session.user.id,
        orderNumber,
        status,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
