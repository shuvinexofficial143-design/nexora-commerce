import { apiFetch } from "@/lib/api/http";
import type { SellerAccountProfile } from "@/types/seller";

export function fetchSellerProfile() {
  return apiFetch<SellerAccountProfile>("/api/backend/seller/profile");
}

export function updateSellerProfile(input: {
  storeName: string;
  ownerName: string;
  phone: string;
  gstNumber: string;
}) {
  return apiFetch<SellerAccountProfile>("/api/backend/seller/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
