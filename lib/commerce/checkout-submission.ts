import type { CartLine } from "@/types/cart";
import type { CheckoutPreview } from "@/lib/commerce/checkout-preview";
import { variantSignature } from "@/lib/commerce/product-variants";
import { checkoutPreviewRequest } from "@/lib/api/checkout-preview-client";
import type { CheckoutAddress, PaymentMethodId } from "@/types/checkout";
import type { CreateOrderPayload } from "@/types/backend";

type CheckoutDraft = {
  lines: CartLine[];
  coupon: string;
  deliveryId: string;
  paymentId: PaymentMethodId;
  email: string;
  address?: CheckoutAddress;
};

/** Stable fingerprint input for the entire customer's purchase intent.
 * Never trust it as authorization; server order transaction is authoritative. */
export function checkoutIntentSignature(draft: CheckoutDraft): string {
  return JSON.stringify({
    items: checkoutPreviewRequest(draft.lines, draft.coupon, "standard").items
      .map(row => [row.slug, row.quantity, JSON.stringify(Object.entries(row.options ?? {}).sort(([a], [b]) => a.localeCompare(b))),
        row.clientPriceMinor]),
    coupon: draft.coupon.trim().toUpperCase(),
    deliveryId: draft.deliveryId,
    paymentId: draft.paymentId,
    email: draft.email.trim().toLowerCase(),
    address: draft.address ? {
      fullName: draft.address.fullName, phone: draft.address.phone,
      line1: draft.address.line1, city: draft.address.city,
      state: draft.address.state, postalCode: draft.address.postalCode,
      country: draft.address.country,
    } : null,
  });
}

/** Browser-only non-reversible key; no address or personal data is written into
 * pending-payment session storage. */
export async function checkoutIntentDigest(signature: string): Promise<string> {
  const data = new TextEncoder().encode(signature);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return Array.from(hash, byte => byte.toString(16).padStart(2, "0")).join("");
}

export type PendingOnlineOrder = {
  orderNumber: string;
  email: string;
  digest: string;
};

/** Session storage is untrusted. Validate shape before attempting ANY retry. */
export function parsePendingOnlineOrder(raw: string | null): PendingOnlineOrder | null {
  if (!raw || raw.length > 1024) return null;
  try {
    const candidate: unknown = JSON.parse(raw);
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const row = candidate as Record<string, unknown>;
    if (typeof row.orderNumber !== "string"
      || !/^NX-[0-9]{8}-[A-F0-9]{8}$/.test(row.orderNumber)
      || typeof row.email !== "string"
      || row.email.length > 254
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)
      || typeof row.digest !== "string"
      || !/^[0-9a-f]{64}$/.test(row.digest)) return null;
    return { orderNumber: row.orderNumber, email: row.email, digest: row.digest };
  } catch { return null; }
}

/** Fail closed when a supposedly verified quote reorders, removes or changes
 * a cart line. Product IDs come directly from the matching server quote. */
export function verifiedCheckoutOrderItems(
  lines: CartLine[], preview: CheckoutPreview,
): CreateOrderPayload["items"] {
  if (!preview.valid || preview.changedPrice || preview.lines.length !== lines.length)
    throw new Error("Your cart requires another live verification.");
  return lines.map((line, index) => {
    const verified = preview.lines[index];
    if (!verified || verified.slug !== line.slug || verified.quantity !== line.quantity
      || variantSignature(verified.options) !== variantSignature(line.choices)
      || verified.state !== "available"
      || verified.availableStock < line.quantity
      || !verified.productId || !verified.sku
      || verified.unitPriceMinor === null
      || !Number.isSafeInteger(verified.unitPriceMinor)
      || verified.unitPriceMinor < 0
      || verified.lineTotalMinor !== verified.unitPriceMinor * line.quantity
      || verified.unitPriceMinor !== Math.round(line.price * 100)) {
      throw new Error("Verified SKU, stock or price no longer matches your bag. Review checkout.");
    }
    return {
      productId: verified.productId,
      quantity: line.quantity,
      expectedUnitPriceMinor: verified.unitPriceMinor,
      variant: line.choices ?? {},
    };
  });
}
