import { apiFetch } from "@/lib/api/http";

export function advanceMySellerOrder(
  orderNumber: string,
  status: "Processing" | "Packed" | "Shipped",
) {
  return apiFetch<{ orderNumber: string; status: string }>(
    `/api/backend/seller/orders/${encodeURIComponent(orderNumber)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}
