import { NextResponse } from "next/server";
import { multiVendorEnabled } from "@/lib/config/features";
import { getCurrentSession } from "@/lib/auth/session";
import {
  adjustSellerProductStock,
  updateSellerProduct,
} from "@/lib/db/seller-products";
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
  context: { params: Promise<{ productId: string }> },
) {
  try {
    const auth = await requireSeller();
    if (!auth.session) return auth.response;

    const { productId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action ?? "update");

    if (action === "stock") {
      return ok(
        await adjustSellerProductStock(
          auth.session.user.id,
          productId,
          Number(body.delta),
        ),
      );
    }

    return ok(
      await updateSellerProduct(auth.session.user.id, productId, {
        ...(typeof body.name === "string" ? { name: body.name } : {}),
        ...(typeof body.price === "number" ? { price: body.price } : {}),
        ...(body.status === "Live" || body.status === "Draft" || body.status === "Paused"
          ? { status: body.status }
          : {}),
        ...(typeof body.videoUrl === "string" ? { videoUrl: body.videoUrl } : {}),
        ...(typeof body.posterUrl === "string" ? { posterUrl: body.posterUrl } : {}),
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
