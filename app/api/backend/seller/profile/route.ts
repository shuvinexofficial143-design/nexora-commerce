import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getSellerAccountProfile, updateSellerAccountProfile } from "@/lib/db/seller-profile";
import { apiError, ok } from "@/lib/server/backend";
import { ValidationError } from "@/lib/db/errors";

export const runtime = "nodejs";

async function requireSellerSession() {
  const session = await getCurrentSession();

  if (!session) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Sign in required." },
        { status: 401 },
      ),
      session: null,
    };
  }

  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    return {
      response: NextResponse.json(
        { ok: false, error: "Seller access required." },
        { status: 403 },
      ),
      session: null,
    };
  }

  return { response: null, session };
}

export async function GET() {
  try {
    const auth = await requireSellerSession();
    if (!auth.session) return auth.response;

    const profile = await getSellerAccountProfile(auth.session.user.id);
    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "Seller profile not found." },
        { status: 404 },
      );
    }

    return ok(profile);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireSellerSession();
    if (!auth.session) return auth.response;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const storeName = String(body.storeName ?? "").trim();
    const ownerName = String(body.ownerName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const gstNumber = String(body.gstNumber ?? "").trim().toUpperCase();

    if (storeName.length < 2) {
      throw new ValidationError("Store name must be at least 2 characters.");
    }
    if (ownerName.length < 2) {
      throw new ValidationError("Owner name must be at least 2 characters.");
    }
    if (phone && phone.length < 8) {
      throw new ValidationError("Enter a valid phone number.");
    }

    const profile = await updateSellerAccountProfile(auth.session.user.id, {
      storeName,
      ownerName,
      phone,
      gstNumber,
    });

    return ok(profile);
  } catch (error) {
    return apiError(error);
  }
}
