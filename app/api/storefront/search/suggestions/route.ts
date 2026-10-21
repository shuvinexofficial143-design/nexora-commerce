import { NextResponse } from "next/server";
import {
  normalizeStoreSearch,
  searchTerms,
  suggestStoreProducts,
} from "@/lib/storefront/product-discovery";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "public, max-age=0, must-revalidate" };
  const limited = consumeRateLimit(request, "store-search-suggest", 80, 60_000);
  if (!limited.allowed) return NextResponse.json(
    { ok: false, error: "Too many searches. Try again shortly." },
    { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(limited.retryAfterSeconds) } },
  );
  const input = new URL(request.url).searchParams.get("q") ?? "";
  if (input.length > 160) return NextResponse.json({ ok: false, error: "Search is too long." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  const query = normalizeStoreSearch(input);
  if (!searchTerms(query).length) return NextResponse.json({ ok: true, data: [] }, { headers: { "Cache-Control": "no-store" } });
  try {
    const products = await suggestStoreProducts(query);
    return NextResponse.json({ ok: true, data: products }, { headers });
  } catch (error) {
    console.warn("NEXORA storefront suggestions unavailable", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ ok: false, error: "Product search is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
