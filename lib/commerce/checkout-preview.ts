import { ValidationError } from "@/lib/db/errors";
import { deserializeProductChoiceGroups, normalizeChosenOptions, validateChosenOptions } from "@/lib/commerce/product-choices";
import { variantSignature } from "@/lib/commerce/product-variants";
import { getPrisma } from "@/lib/db/prisma";
import { resolveCoupon } from "@/lib/commerce/coupon-engine";
import { calculateAuthoritativeTotals, type StoreDeliveryMethod } from "@/lib/commerce/order-pricing";

export type CheckoutPreviewInput = {
  items: Array<{ slug: string; quantity: number; clientPriceMinor?: number; options?: Record<string, string> }>;
  coupon?: string;
  deliveryMethod?: StoreDeliveryMethod;
};
export type CheckoutPreviewLine = {
  slug: string; productId: string | null; variantId: string | null; sku: string | null; name: string; options: Record<string, string>;
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
    return { slug, quantity, options: normalizeChosenOptions(row.options), ...(clientPriceMinor === undefined ? {} : { clientPriceMinor: clientPriceMinor as number }) };
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
      id: true, slug: true, sku: true, name: true, priceMinor: true, currency: true,
      inventory: { select: { onHand: true, reserved: true } },
      choiceGroups: { select: { key: true, label: true, required: true, sortOrder: true, values: true } },
      variants: { select: { id: true, sku: true, signature: true, priceMinor: true,
        onHand: true, reserved: true, active: true } },
    },
  });
  const bySlug = new Map(products.map(p => [p.slug, p]));
  // Demand is grouped by actual purchasable stock bucket, not by product slug.
  const demand = new Map<string, number>();
  for (const row of input.items) {
    const product = bySlug.get(row.slug);
    if (!product) continue;
    const matched = product.variants.length ?
      product.variants.find(v => v.signature === variantSignature(row.options) && v.active) : null;
    const bucket = matched ? "variant:" + matched.id : "product:" + product.id;
    demand.set(bucket, (demand.get(bucket) ?? 0) + row.quantity);
  }
  const issues: string[] = [];
  let subtotalMinor = 0;
  let changedPrice = false;
  const lines: CheckoutPreviewLine[] = input.items.map(row => {
    const product = bySlug.get(row.slug);
    if (!product || product.currency !== "INR" || !Number.isSafeInteger(product.priceMinor) || product.priceMinor < 0) {
      const message = row.slug + " is no longer available for checkout.";
      if (!issues.includes(message)) issues.push(message);
      return { slug: row.slug, productId: null, variantId: null, sku: null, name: row.slug,
        quantity: row.quantity, options: row.options ?? {}, availableStock: 0,
        unitPriceMinor: null, lineTotalMinor: null, changedPrice: false, state: "unavailable" };
    }
    let optionValid = true;
    try { validateChosenOptions(deserializeProductChoiceGroups(product.choiceGroups), row.options); }
    catch (err) {
      optionValid = false;
      const message = err instanceof Error ? err.message : "Invalid product option.";
      if (!issues.includes(message)) issues.push(message);
    }
    const matched = product.variants.length ?
      product.variants.find(v => v.signature === variantSignature(row.options) && v.active) : null;
    if (product.variants.length && !matched) {
      optionValid = false;
      const message = product.name + ": selected SKU combination is unavailable.";
      if (!issues.includes(message)) issues.push(message);
    }
    const availableStock = !optionValid ? 0 : matched ?
      Math.max(0, matched.onHand - matched.reserved)
      : product.inventory.reduce((n, stock) => n + Math.max(0, stock.onHand - stock.reserved), 0);
    const bucket = matched ? "variant:" + matched.id : "product:" + product.id;
    const quantityAllowed = availableStock >= (demand.get(bucket) ?? row.quantity);
    if (optionValid && !quantityAllowed) {
      const message = product.name + " has insufficient stock (available: " + availableStock + ").";
      if (!issues.includes(message)) issues.push(message);
    }
    const unitPriceMinor = matched ? matched.priceMinor : product.priceMinor;
    const lineTotalMinor = unitPriceMinor * row.quantity;
    subtotalMinor += lineTotalMinor;
    const priceDifference = row.clientPriceMinor !== undefined && unitPriceMinor !== row.clientPriceMinor;
    changedPrice ||= priceDifference;
    return {
      slug: row.slug, productId: product.id, variantId: matched?.id ?? null,
      sku: matched?.sku ?? product.sku, name: product.name,
      quantity: row.quantity, options: row.options ?? {}, availableStock,
      unitPriceMinor, lineTotalMinor, changedPrice: priceDifference,
      state: !optionValid ? "unavailable" : quantityAllowed ? "available" : "insufficient_stock",
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
