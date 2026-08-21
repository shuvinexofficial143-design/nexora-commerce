import { listProducts } from "@/lib/db/products";
import { apiError, ok } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const result = await listProducts({
      query: url.searchParams.get("q") || undefined,
      category: url.searchParams.get("category") || undefined,
      brand: url.searchParams.get("brand") || undefined,
      limit: Number(url.searchParams.get("limit") || 24),
      offset: Number(url.searchParams.get("offset") || 0),
    });
    return ok(result);
  } catch (error) {
    return apiError(error);
  }
}
