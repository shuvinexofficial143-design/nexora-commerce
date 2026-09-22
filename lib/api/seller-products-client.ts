import { apiFetch } from "@/lib/api/http";
import type { SellerProduct } from "@/types/seller";

export function fetchSellerProducts() {
  return apiFetch<SellerProduct[]>("/api/backend/seller/products");
}

export function createMySellerProduct(input: {
  name: string;
  sku: string;
  price: number;
  description: string;
}) {
  return apiFetch<{ id: string; slug: string; sku: string; status: "Draft" }>(
    "/api/backend/seller/products",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
