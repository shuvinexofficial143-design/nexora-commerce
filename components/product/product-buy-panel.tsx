"use client";

import { useState } from "react";
import { ProductVariantPicker } from "@/components/product/product-variant-picker";
import { ProductChoicePicker } from "@/components/product/product-choice-picker";
import type { ProductChoiceGroup } from "@/lib/commerce/product-choices";
import type { BackendProduct } from "@/types/backend";
import { variantSignature } from "@/lib/commerce/product-variants";
import { ProductActions } from "@/components/product/product-actions";
import { ProductStickyBuybar } from "@/components/product/product-sticky-buybar";
import type { CartProductSnapshot } from "@/types/cart";
import type { ProductOption } from "@/types/product-detail";

export function ProductBuyPanel({
  product,
  colors,
  sizes,
  groups = [],
  variants = [],
  requiresVariant = false,
  verifyLive = false,
}: {
  product: CartProductSnapshot;
  colors: ProductOption[];
  sizes: ProductOption[];
  groups?: ProductChoiceGroup[];
  variants?: NonNullable<BackendProduct["variants"]>;
  requiresVariant?: boolean;
  verifyLive?: boolean;
}) {
  const [choices, setChoices] = useState<Record<string,string>>({});
  const matched = requiresVariant ? variants.find(v => v.signature === variantSignature(choices) && v.active) : undefined;
  const available = matched ? matched.availableStock > 0 : !requiresVariant;
  const ready = groups.every(group => !group.required || group.values.some(v => v.available && choices[group.key] === v.value)) && available;
  const chosenProduct = requiresVariant
    ? { ...product, price: (matched?.priceMinor ?? 0) / 100,
        stock: matched?.availableStock ? matched.availableStock <= 8 ? "low-stock" as const : "in-stock" as const : "out-of-stock" as const }
    : product;
  const [color, setColor] = useState(colors[0]?.value ?? "");
  const [size, setSize] = useState(sizes.find((item) => item.available !== false)?.value ?? "");

  return (
    <>
      {groups.length > 0 && <ProductChoicePicker groups={groups} selected={choices} onChange={setChoices} />}
      {requiresVariant && <div role="status" className="mt-3 rounded-xl bg-[#f7f7f3] p-3 text-sm font-bold">
        {matched ? `SKU ${matched.sku} · ₹${(matched.priceMinor / 100).toLocaleString("en-IN")} · ${matched.availableStock} available`
          : "Select an available SKU combination to see price and stock."}
      </div>}
      <ProductVariantPicker
        colors={colors}
        sizes={sizes}
        color={color}
        size={size}
        onColorChange={setColor}
        onSizeChange={setSize}
      />
      <div className="mt-4 sm:mt-6">
        <ProductActions product={chosenProduct} color={color || undefined} size={size || undefined} choices={choices} ready={ready} verifyLive={verifyLive} />
      </div>
      <ProductStickyBuybar product={chosenProduct} color={color || undefined} size={size || undefined} choices={choices} ready={ready} verifyLive={verifyLive} />
    </>
  );
}
