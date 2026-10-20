"use client";

import { useState } from "react";
import { ProductVariantPicker } from "@/components/product/product-variant-picker";
import { ProductActions } from "@/components/product/product-actions";
import { ProductStickyBuybar } from "@/components/product/product-sticky-buybar";
import type { CartProductSnapshot } from "@/types/cart";
import type { ProductOption } from "@/types/product-detail";

export function ProductBuyPanel({
  product,
  colors,
  sizes,
}: {
  product: CartProductSnapshot;
  colors: ProductOption[];
  sizes: ProductOption[];
}) {
  const [color, setColor] = useState(colors[0]?.value ?? "");
  const [size, setSize] = useState(sizes.find((item) => item.available !== false)?.value ?? "");

  return (
    <>
      <ProductVariantPicker
        colors={colors}
        sizes={sizes}
        color={color}
        size={size}
        onColorChange={setColor}
        onSizeChange={setSize}
      />
      <div className="mt-4 sm:mt-6">
        <ProductActions product={product} color={color || undefined} size={size || undefined} />
      </div>
      <ProductStickyBuybar product={product} color={color || undefined} size={size || undefined} />
    </>
  );
}
