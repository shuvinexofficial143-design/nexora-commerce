import { ValidationError } from "@/lib/db/errors";
import { validateChosenOptions, type ProductChoiceGroup, normalizeChosenOptions } from "@/lib/commerce/product-choices";

export type ProductSkuVariant = {
  id: string;
  choices: Record<string, string>;
  signature: string;
  sku: string;
  priceMinor: number;
  onHand: number;
  reserved: number;
  active: boolean;
};
const skuFormat = /^[A-Za-z0-9][A-Za-z0-9._-]{1,79}$/;

export function variantSignature(raw: unknown): string {
  return JSON.stringify(normalizeChosenOptions(raw));
}
export function validateVariantDefinition(
  groups: ProductChoiceGroup[],
  raw: unknown,
): { choices: Record<string,string>; signature: string; sku: string; priceMinor: number; onHand: number; active: boolean } {
  if (!groups.length) throw new ValidationError("Create product choices before SKU variants.");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new ValidationError("Invalid SKU variant.");
  const input = raw as Record<string, unknown>;
  const choices = validateChosenOptions(groups, input.choices);
  if (!Object.keys(choices).length) throw new ValidationError("A SKU variant needs a selected option.");
  const sku = typeof input.sku === "string" ? input.sku.trim() : "";
  if (!skuFormat.test(sku)) throw new ValidationError("Variant SKU must be 2-80 letters, numbers, hyphens, underscores or dots.");
  const priceMinor = input.priceMinor;
  const onHand = input.onHand;
  if (!Number.isSafeInteger(priceMinor) || (priceMinor as number) < 0 || (priceMinor as number) > 100_000_000) {
    throw new ValidationError("Invalid variant price in paise.");
  }
  if (!Number.isSafeInteger(onHand) || (onHand as number) < 0 || (onHand as number) > 1_000_000) {
    throw new ValidationError("Invalid variant stock quantity.");
  }
  if (typeof input.active !== "boolean") throw new ValidationError("Variant availability must be set explicitly.");
  return { choices, signature: variantSignature(choices), sku, priceMinor: priceMinor as number,
    onHand: onHand as number, active: input.active };
}

export function publicVariant(row: ProductSkuVariant) {
  // Customer never sees internal database metadata beyond SKU and availability.
  return { id: row.id, choices: normalizeChosenOptions(row.choices), signature: row.signature, sku: row.sku,
    priceMinor: row.priceMinor, availableStock: Math.max(0, row.onHand - row.reserved),
    active: row.active };
}
