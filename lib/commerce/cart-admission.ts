import type { CartLine, CartProductSnapshot } from "@/types/cart";
import type { CheckoutPreview, CheckoutPreviewInput } from "@/lib/commerce/checkout-preview";
import { normalizeChosenOptions } from "@/lib/commerce/product-choices";
import { variantSignature } from "@/lib/commerce/product-variants";

/** Read-only SKU admission check: never reserves stock or charges payment. */
export function buildCartAdmissionRequest(
  product: CartProductSnapshot,
  rawChoices: Record<string,string> | undefined,
  current: CartLine[],
  requestedQuantity = 1,
): CheckoutPreviewInput {
  if (!Number.isSafeInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 10)
    throw new Error("Choose a quantity between 1 and 10.");
  if (!Number.isFinite(product.price) || product.price < 0) throw new Error("Product price unavailable.");
  const options = normalizeChosenOptions(rawChoices);
  const signature = variantSignature(options);
  const sameSlug = current.filter(x => x.slug === product.slug);
  const total = sameSlug.reduce((sum,x) => sum + x.quantity,0);
  if (total + requestedQuantity > 20) throw new Error("A product cannot exceed 20 units per checkout.");
  const existingQuantity = sameSlug
    .filter(x => variantSignature(x.choices) === signature)
    .reduce((sum,x) => sum + x.quantity,0);
  return {
    items: [{ slug: product.slug, quantity: existingQuantity + requestedQuantity,
      options, clientPriceMinor: Math.round(product.price * 100) }],
    deliveryMethod: "standard",
  };
}

export function assertCartAdmission(quote: CheckoutPreview, request: CheckoutPreviewInput): void {
  const desired = request.items[0];
  const actual = quote.lines[0];
  if (!actual || quote.lines.length !== 1 || actual.slug !== desired.slug || actual.quantity !== desired.quantity)
    throw new Error("Could not verify the selected SKU. Please retry.");
  if (quote.changedPrice || actual.unitPriceMinor !== desired.clientPriceMinor)
    throw new Error("This SKU price changed. Reload the product and review its current price.");
  if (!quote.valid || actual.state !== "available" || actual.availableStock < desired.quantity)
    throw new Error(quote.issues[0] || "The selected SKU is no longer available in that quantity.");
  if (!actual.productId || !actual.sku || actual.unitPriceMinor === null)
    throw new Error("The store could not verify this SKU.");
}
