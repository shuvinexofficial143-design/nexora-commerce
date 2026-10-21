import { apiFetch } from "@/lib/api/http";
import type { BackendOrder, CreateOrderPayload } from "@/types/backend";

const STORAGE_KEY = "nexora-checkout-attempt-v1";

export function fetchMyOrders() {
  return apiFetch<BackendOrder[]>("/api/backend/orders");
}
export function fetchMyOrder(orderId: string) {
  return apiFetch<BackendOrder>(`/api/backend/orders/${encodeURIComponent(orderId)}`);
}

async function persistentAttemptKey(payload: CreateOrderPayload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const fingerprint = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null") as { fingerprint?: string; key?: string } | null;
    if (stored?.fingerprint === fingerprint && stored.key && /^[A-Za-z0-9_-]{16,128}$/.test(stored.key)) {
      return stored.key;
    }
  } catch { /* storage unavailable; send fresh key for this attempt */ }
  const key = crypto.randomUUID();
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint, key })); } catch {}
  return key;
}

export function clearCheckoutAttempt() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

export async function submitBackendOrder(payload: CreateOrderPayload) {
  const key = await persistentAttemptKey(payload);
  return apiFetch<BackendOrder>("/api/backend/orders", {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: JSON.stringify(payload),
  });
}
