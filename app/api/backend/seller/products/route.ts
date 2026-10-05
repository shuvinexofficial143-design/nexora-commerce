import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { createSellerProduct, listSellerProducts } from "@/lib/db/seller-products";
import { apiError, ok } from "@/lib/server/backend";

export const runtime = "nodejs";

async function requireSeller() {
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

export async function GET() {
  try {
    const auth = await requireSeller();
    if (!auth.session) return auth.response;

    return ok(await listSellerProducts(auth.session.user.id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSeller();
    if (!auth.session) return auth.response;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const product = await createSellerProduct(auth.session.user.id, {
      name: String(body.name ?? ""),
      sku: String(body.sku ?? ""),
      price: Number(body.price),
      description: String(body.description ?? ""),
      videoUrl: String(body.videoUrl ?? ""),
      posterUrl: String(body.posterUrl ?? ""),
    });

    return ok(product, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
