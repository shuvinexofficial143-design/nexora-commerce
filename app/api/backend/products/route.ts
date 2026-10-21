import { listProducts } from "@/lib/db/products";
import { apiError, ok } from "@/lib/server/backend";
import { parseLiveCatalogQuery, toProductListQuery } from "@/lib/storefront/catalog-query";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const entries: Record<string, string | string[]> = {};
    for (const key of ["q", "category", "brand", "sort", "min", "max", "rating", "page"]) {
      const all = params.getAll(key);
      if (all.length) entries[key] = all.length === 1 ? all[0] : all;
    }
    const query = parseLiveCatalogQuery(entries);
    const input = toProductListQuery(query);
    // Retain existing limit/offset callers with strict integer bounds.
    const rawLimit = params.get("limit");
    const rawOffset = params.get("offset");
    if (rawLimit && /^\d{1,3}$/.test(rawLimit)) input.limit = Math.min(Math.max(Number(rawLimit), 1), 100);
    if (rawOffset && /^\d{1,7}$/.test(rawOffset)) input.offset = Math.min(Number(rawOffset), 1_000_000);
    else if (input.limit !== undefined) input.offset = (query.page - 1) * input.limit;
    return ok(await listProducts(input));
  } catch (error) {
    return apiError(error);
  }
}
