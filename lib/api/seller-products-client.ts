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
  videoUrl?: string;
  posterUrl?: string;
}) {
  return apiFetch<{ id: string; slug: string; sku: string; status: "Draft" }>(
    "/api/backend/seller/products",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}


export function updateMySellerProduct(
  productId: string,
  input: {
    name?: string;
    price?: number;
    status?: "Live" | "Draft" | "Paused";
    videoUrl?: string;
    posterUrl?: string;
  },
) {
  return apiFetch<{
    id: string;
    name: string;
    price: number;
    status: "Live" | "Draft" | "Paused";
  }>(`/api/backend/seller/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "update", ...input }),
  });
}

export function adjustMySellerProductStock(productId: string, delta: number) {
  return apiFetch<{
    productId: string;
    onHand: number;
    reserved: number;
    available: number;
  }>(`/api/backend/seller/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "stock", delta }),
  });
}
