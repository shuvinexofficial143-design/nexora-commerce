import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { createAddressForUser, listAddressesForUser } from "@/lib/db/addresses";
import { apiError, ok } from "@/lib/server/backend";
import { ValidationError } from "@/lib/db/errors";
import type { CheckoutAddress } from "@/types/checkout";

export const runtime = "nodejs";

function validateAddress(value: unknown): Omit<CheckoutAddress, "id"> {
  const input = (value ?? {}) as Record<string, unknown>;
  const address = {
    label: String(input.label ?? "Home").trim() || "Home",
    fullName: String(input.fullName ?? "").trim(),
    phone: String(input.phone ?? "").trim(),
    line1: String(input.line1 ?? "").trim(),
    city: String(input.city ?? "").trim(),
    state: String(input.state ?? "").trim(),
    postalCode: String(input.postalCode ?? "").trim(),
    country: String(input.country ?? "India").trim() || "India",
  };

  for (const key of ["fullName", "phone", "line1", "city", "state", "postalCode"] as const) {
    if (!address[key]) throw new ValidationError(`Address ${key} is required.`);
  }

  if (!/^[0-9]{6}$/.test(address.postalCode)) {
    throw new ValidationError("Enter a valid 6-digit PIN code.");
  }

  return address;
}

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
    }

    return ok(await listAddressesForUser(session.user.id));
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

    const input = validateAddress(await request.json());
    return ok(await createAddressForUser(session.user.id, input), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
