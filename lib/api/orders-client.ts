import { apiFetch } from "@/lib/api/http";
import type { BackendOrder, CreateOrderPayload } from "@/types/backend";

export function fetchMyOrders() {
  return apiFetch<BackendOrder[]>("/api/backend/orders");
}

export function fetchMyOrder(orderId: string) {
  return apiFetch<BackendOrder>(`/api/backend/orders/${encodeURIComponent(orderId)}`);
}

export function submitBackendOrder(payload: CreateOrderPayload) {
  return apiFetch<BackendOrder>("/api/backend/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
