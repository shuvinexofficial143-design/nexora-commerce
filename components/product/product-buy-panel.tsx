"use client";

import { useState } from "react";
import { ProductVariantPicker } from "@/components/product/product-variant-picker";
import { ProductChoicePicker } from "@/components/product/product-choice-picker";
import type { ProductChoiceGroup } from "@/lib/commerce/product-choices";
import { ProductActions } from "@/components/product/product-actions";
import { ProductStickyBuybar } from "@/components/product/product-sticky-buybar";
import type { CartProductSnapshot } from "@/types/cart";
import type { ProductOption } from "@/types/product-detail";

export function ProductBuyPanel({
  product,
  colors,
  sizes,
  groups = [],
}: {
  product: CartProductSnapshot;
  colors: ProductOption[];
  sizes: ProductOption[];
  groups?: ProductChoiceGroup[];
}) {
  const [choices, setChoices] = useState<Record<string,string>>({});
  const ready = groups.every(group => !group.required || group.values.some(v => v.available && choices[group.key] === v.value));
  const [color, setColor] = useState(colors[0]?.value ?? "");
  const [size, setSize] = useState(sizes.find((item) => item.available !== false)?.value ?? "");

  return (
    <>
      {groups.length > 0 && <ProductChoicePicker groups={groups} selected={choices} onChange={setChoices} />}
      <ProductVariantPicker
        colors={colors}
        sizes={sizes}
        color={color}
        size={size}
        onColorChange={setColor}
        onSizeChange={setSize}
      />
      <div className="mt-4 sm:mt-6">
        <ProductActions product={product} color={color || undefined} size={size || undefined} choices={choices} ready={ready} />
      </div>
      <ProductStickyBuybar product={product} color={color || undefined} size={size || undefined} choices={choices} ready={ready} />
    </>
  );
}
