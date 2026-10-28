import { apiFetch } from "@/lib/api/http";
import type { CheckoutRecoveryResult } from "@/lib/commerce/checkout-attempt-recovery";
import type { BackendOrder, CreateOrderPayload } from "@/types/backend";
import { parsePendingOnlineOrder, type PendingOnlineOrder } from "@/lib/commerce/checkout-submission";

const STORAGE_KEY = "nexora-checkout-attempt-v1";
export type CheckoutAttemptRecord = { key: string; fingerprint: string; email: string };
export function readCheckoutAttempt(): CheckoutAttemptRecord | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw || raw.length > 1024) return null;
    const record: unknown = JSON.parse(raw);
    if (!record || typeof record !== "object" || Array.isArray(record)) return null;
    const value = record as Record<string,unknown>;
    if (typeof value.key !== "string" || !/^[A-Za-z0-9_-]{16,128}$/.test(value.key) ||
      typeof value.fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(value.fingerprint) ||
      typeof value.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) ||
      value.email.length > 254) return null;
    return { key: value.key, fingerprint: value.fingerprint, email: value.email };
  } catch { return null; }
}

/** Uses a random browser-held checkout key as the capability, scoped by
 * customer email. Never fetches private order details or sends payment. */
export function fetchCheckoutAttemptRecovery(attempt: Pick<CheckoutAttemptRecord, "key" | "email">) {
  return apiFetch<CheckoutRecoveryResult>("/api/backend/orders/recover", {
    method: "POST",
    headers: { "Idempotency-Key": attempt.key },
    body: JSON.stringify({ key: attempt.key, email: attempt.email }),
  });
}

const PENDING_ONLINE_KEY = "nexora-pending-online-order-v1";

// A successfully created online order already owns its reservation. Retry
// hosted checkout against that order, never create a duplicate reservation.
export function readPendingOnlineOrder(): PendingOnlineOrder | null {
  try { return parsePendingOnlineOrder(sessionStorage.getItem(PENDING_ONLINE_KEY)); }
  catch { return null; }
}
export function rememberPendingOnlineOrder(order: PendingOnlineOrder): void {
  try { sessionStorage.setItem(PENDING_ONLINE_KEY, JSON.stringify(order)); }
  catch { /* In-memory state still permits the retry while tab remains open. */ }
}
export function clearPendingOnlineOrder(): void {
  try { sessionStorage.removeItem(PENDING_ONLINE_KEY); } catch {}
}


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
    if (stored?.fingerprint === fingerprint && stored.key &&
      /^[A-Za-z0-9_-]{16,128}$/.test(stored.key)) {
      // Older recorded attempts predate the email field. Add it without
      // changing the secret key or the checkout's idempotency scope.
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        fingerprint, key: stored.key, email: payload.contactEmail?.trim().toLowerCase(),
      })); } catch {}
      return stored.key;
    }
  } catch { /* storage unavailable; send fresh key for this attempt */ }
  const key = crypto.randomUUID();
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint, key, email: payload.contactEmail?.trim().toLowerCase() })); } catch {}
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
