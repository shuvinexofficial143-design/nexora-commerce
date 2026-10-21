// Shared by actual order persistence and side-effect-free checkout previews.
// Money is always calculated in minor INR units (paise), not client floats.
export type StoreDeliveryMethod = "standard" | "express" | "priority";
export const STANDARD_FREE_SHIPPING_THRESHOLD_MINOR = 99900;
export const STANDARD_SHIPPING_MINOR = 9900;

export function calculateAuthoritativeTotals(input: {
  subtotalMinor: number;
  discountMinor: number;
  deliveryMethod: StoreDeliveryMethod;
}) {
  const { subtotalMinor, discountMinor, deliveryMethod } = input;
  if (!Number.isSafeInteger(subtotalMinor) || subtotalMinor < 0 || subtotalMinor > 2_000_000_000) {
    throw new Error("Invalid order subtotal.");
  }
  if (!Number.isSafeInteger(discountMinor) || discountMinor < 0 || discountMinor > subtotalMinor) {
    throw new Error("Invalid discount amount.");
  }
  const shippingMinor = deliveryMethod === "priority" ? 29900
    : deliveryMethod === "express" ? 14900
      : subtotalMinor >= STANDARD_FREE_SHIPPING_THRESHOLD_MINOR ? 0 : STANDARD_SHIPPING_MINOR;
  const taxMinor = Math.round((subtotalMinor - discountMinor) * 0.18);
  const totalMinor = subtotalMinor - discountMinor + shippingMinor + taxMinor;
  if (!Number.isSafeInteger(totalMinor) || totalMinor > 2_000_000_000) throw new Error("Invalid payable total.");
  return { subtotalMinor, discountMinor, shippingMinor, taxMinor, totalMinor };
}
