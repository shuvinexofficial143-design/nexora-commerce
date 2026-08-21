import { apiFetch } from "@/lib/api/http";
import type { ProductResolution } from "@/types/backend";

export function resolveProductSlugs(slugs: string[]) {
  return apiFetch<ProductResolution[]>("/api/backend/products/resolve", {
    method: "POST",
    body: JSON.stringify({ slugs }),
  });
}
