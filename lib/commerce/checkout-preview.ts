import { ValidationError } from "@/lib/db/errors";
import { getPrisma } from "@/lib/db/prisma";
import { resolveCoupon } from "@/lib/commerce/coupon-engine";
import { calculateAuthoritativeTotals, type StoreDeliveryMethod } from "@/lib/commerce/order-pricing";

export type CheckoutPreviewInput = {
  items: Array<{ slug: string; quantity: number; clientPriceMinor?: number }>;
  coupon?: string;
  deliveryMethod?: StoreDeliveryMethod;
};
export type CheckoutPreviewLine = {
  slug: string; productId: string | null; name: string;
  quantity: number; availableStock: number; unitPriceMinor: number | null;
  lineTotalMinor: number | null; changedPrice: boolean;
  state: "available" | "unavailable" | "insufficient_stock";
};
export type CheckoutPreview = {
  valid: boolean; changedPrice: boolean; lines: CheckoutPreviewLine[];
  subtotalMinor: number; discountMinor: number; shippingMinor: number;
  taxMinor: number; totalMinor: number; currency: "INR";
  issues: string[]; couponApplied: boolean; deliveryMethod: StoreDeliveryMethod;
  verifiedAt: string;
};

const slugPattern = /^[a-z0-9][a-z0-9-]{0,120}$/;
export function validateCheckoutPreview(value: unknown): CheckoutPreviewInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("Invalid checkout preview.");
  }
  const body = value as Record<string, unknown>;
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    throw new ValidationError("Checkout must contain 1 to 50 cart lines.");
  }
  const demand = new Map<string, number>();
  const items = body.items.map((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new ValidationError("Invalid cart line.");
    const row = raw as Record<string, unknown>;
    const slug = typeof row.slug === "string" ? row.slug.trim().toLowerCase() : "";
    const quantity = row.quantity;
    if (!slugPattern.test(slug) || typeof quantity !== "number" || !Number.isInteger(quantity)
        || quantity < 1 || quantity > 20) {
      throw new ValidationError("Cart needs a valid product and a quantity between 1 and 20.");
    }
    const total = (demand.get(slug) ?? 0) + quantity;
    if (total > 20) throw new ValidationError("A product cannot exceed 20 units per order.");
    demand.set(slug, total);
    const clientPriceMinor = row.clientPriceMinor;
    if (clientPriceMinor !== undefined
      && (typeof clientPriceMinor !== "number" || !Number.isSafeInteger(clientPriceMinor)
        || clientPriceMinor < 0 || clientPriceMinor > 2_000_000_000)) {
      throw new ValidationError("Invalid cart price snapshot.");
    }
    return { slug, quantity, ...(clientPriceMinor === undefined ? {} : { clientPriceMinor: clientPriceMinor as number }) };
  });
  const method = body.deliveryMethod ?? "standard";
  if (!["standard", "express", "priority"].includes(String(method))) {
    throw new ValidationError("Invalid delivery method.");
  }
  // Chargeable express and priority delivery are not available until a verified
  // serviceability/fulfilment integration exists. Do not advertise fake ETAs.
  if (method !== "standard") throw new ValidationError("Only standard delivery is currently available.");
  const coupon = body.coupon === undefined ? undefined : String(body.coupon).trim().toUpperCase();
  if (coupon && (coupon.length > 40 || !/^[A-Z0-9_-]+$/.test(coupon))) throw new ValidationError("Invalid coupon code.");
  return { items, deliveryMethod: method as StoreDeliveryMethod, ...(coupon ? { coupon } : {}) };
}

export async function createCheckoutPreview(input: CheckoutPreviewInput): Promise<CheckoutPreview> {
  const uniqueSlugs = [...new Set(input.items.map(row => row.slug))];
  const products = await getPrisma().product.findMany({
    where: { slug: { in: uniqueSlugs }, status: "ACTIVE" },
    select: {
      id: true, slug: true, name: true, priceMinor: true, currency: true,
      inventory: { select: { onHand: true, reserved: true } },
    },
  });
  const bySlug = new Map(products.map(p => [p.slug, p]));
  const demands = new Map<string, number>();
  for (const row of input.items) demands.set(row.slug, (demands.get(row.slug) ?? 0) + row.quantity);
  const issues: string[] = [];
  let subtotalMinor = 0;
  let changedPrice = false;
  const lines: CheckoutPreviewLine[] = input.items.map(row => {
    const product = bySlug.get(row.slug);
    if (!product || product.currency !== "INR" || !Number.isSafeInteger(product.priceMinor) || product.priceMinor < 0) {
      issues.push(`${row.slug} is no longer available for checkout.`);
      return { slug: row.slug, productId: null, name: row.slug, quantity: row.quantity,
        availableStock: 0, unitPriceMinor: null, lineTotalMinor: null,
        changedPrice: false, state: "unavailable" };
    }
    const availableStock = product.inventory.reduce((n, stock) => n + Math.max(0, stock.onHand - stock.reserved), 0);
    const quantityAllowed = availableStock >= demands.get(row.slug)!;
    if (!quantityAllowed && !issues.includes(`${product.name} has insufficient stock.`)) {
      issues.push(`${product.name} has insufficient stock (available: ${availableStock}).`);
    }
    const lineTotalMinor = product.priceMinor * row.quantity;
    subtotalMinor += lineTotalMinor;
    const priceDifference = row.clientPriceMinor !== undefined && product.priceMinor !== row.clientPriceMinor;
    changedPrice ||= priceDifference;
    return {
      slug: row.slug, productId: product.id, name: product.name, quantity: row.quantity,
      availableStock, unitPriceMinor: product.priceMinor, lineTotalMinor,
      changedPrice: priceDifference,
      state: quantityAllowed ? "available" : "insufficient_stock",
    };
  });
  if (!Number.isSafeInteger(subtotalMinor) || subtotalMinor > 2_000_000_000) {
    throw new ValidationError("Cart total exceeds the permitted limit.");
  }
  let discountMinor = 0;
  let couponApplied = false;
  if (input.coupon && issues.length === 0) {
    const promo = await resolveCoupon(input.coupon, subtotalMinor);
    if (!promo.coupon) issues.push("This coupon is not valid for the current cart.");
    else { discountMinor = promo.discountMinor; couponApplied = true; }
  }
  const totals = calculateAuthoritativeTotals({
    subtotalMinor, discountMinor, deliveryMethod: input.deliveryMethod ?? "standard",
  });
  return {
    valid: issues.length === 0, changedPrice, lines, ...totals, currency: "INR", issues,
    couponApplied, deliveryMethod: input.deliveryMethod ?? "standard",
    verifiedAt: new Date().toISOString(),
  };
}
