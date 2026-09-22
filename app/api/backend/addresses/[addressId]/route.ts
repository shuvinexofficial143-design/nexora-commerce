import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { deleteAddressForUser } from "@/lib/db/addresses";
import { apiError, ok } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ addressId: string }> },
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
    }

    const { addressId } = await context.params;
    const deleted = await deleteAddressForUser(session.user.id, addressId);

    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Address not found." }, { status: 404 });
    }

    return ok({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
