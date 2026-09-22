import { apiFetch } from "@/lib/api/http";
import type { BackendReturn } from "@/types/backend";

export function fetchMyReturns() {
  return apiFetch<BackendReturn[]>("/api/backend/returns");
}

export function requestReturn(input: {
  orderNumber: string;
  reason: string;
  details?: string;
}) {
  return apiFetch<{ id: string; orderNumber: string }>("/api/backend/returns", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
