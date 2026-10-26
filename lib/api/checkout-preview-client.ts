import type { CartLine } from "@/types/cart";
import type { CheckoutPreview, CheckoutPreviewInput } from "@/lib/commerce/checkout-preview";

export function checkoutPreviewRequest(lines: CartLine[], coupon: string, deliveryMethod: "standard") : CheckoutPreviewInput {
  return {
    items: lines.map(line => ({
      slug: line.slug,
      quantity: line.quantity,
      ...(line.choices && Object.keys(line.choices).length ? { options: line.choices } : {}),
      clientPriceMinor: Math.round(line.price * 100),
    })),
    deliveryMethod,
    ...(coupon ? { coupon } : {}),
  };
}

export async function fetchCheckoutPreview(request: CheckoutPreviewInput): Promise<CheckoutPreview> {
  const response = await fetch("/api/backend/checkout/preview", {
    method: "POST", credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const body = await response.json() as { ok: boolean; data?: CheckoutPreview; error?: string };
  if (!response.ok || !body.ok || !body.data) {
    throw new Error(body.error || "Price and inventory verification unavailable. Please retry.");
  }
  return body.data;
}

export function checkoutPreviewSignature(quote: CheckoutPreview): string {
  // Ignore verification timestamp, which changes on every read.
  return JSON.stringify({
    lines: quote.lines.map(row => [row.slug, row.productId, row.quantity,
      row.unitPriceMinor, row.availableStock, row.state, row.options]),
    totalMinor: quote.totalMinor,
    subtotalMinor: quote.subtotalMinor,
    discountMinor: quote.discountMinor,
    shippingMinor: quote.shippingMinor,
    taxMinor: quote.taxMinor,
    valid: quote.valid,
    issues: quote.issues,
  });
}
