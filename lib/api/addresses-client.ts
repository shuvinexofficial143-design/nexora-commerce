import { apiFetch } from "@/lib/api/http";
import type { CheckoutAddress } from "@/types/checkout";

export function fetchMyAddresses() {
  return apiFetch<CheckoutAddress[]>("/api/backend/addresses");
}

export function createMyAddress(address: Omit<CheckoutAddress, "id">) {
  return apiFetch<CheckoutAddress>("/api/backend/addresses", {
    method: "POST",
    body: JSON.stringify(address),
  });
}

export function deleteMyAddress(addressId: string) {
  return apiFetch<{ deleted: boolean }>(
    `/api/backend/addresses/${encodeURIComponent(addressId)}`,
    { method: "DELETE" },
  );
}
