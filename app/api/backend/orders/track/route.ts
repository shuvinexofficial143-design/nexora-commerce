import { getPrisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const rate = checkRateLimit(request, {
    scope: "guest-order-track",
    limit: 20,
    windowMs: 5 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many tracking requests. Try again later." },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }

  try {
    const url = new URL(request.url);
    const orderNumber = (url.searchParams.get("order") ?? "").trim();
    const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();

    if (!orderNumber || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Order number and checkout email are required." },
        { status: 400 },
      );
    }

    const order = await getPrisma().order.findFirst({
      where: {
        orderNumber,
        user: { email },
      },
      include: {
        items: {
          select: {
            productName: true,
            quantity: true,
            totalMinor: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "No matching order was found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalMinor: order.totalMinor,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items,
      },
    });
  } catch (error) {
    console.error("NEXORA order tracking error", error);
    return NextResponse.json(
      { ok: false, error: "Could not check this order right now." },
      { status: 500 },
    );
  }
}
