"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasProductAlert, upsertProductAlert } from "@/lib/engagement-store";

export function PriceDropButton({
  product,
}: {
  product: { id: string; slug: string; name: string; image: string; price: number };
}) {
  const router = useRouter();
  const [active, setActive] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setActive(hasProductAlert(product.id, "price-drop")));
  }, [product.id]);

  const toggle = () => {
    if (active) {
      router.push("/account/alerts");
      return;
    }

    upsertProductAlert({
      id: `price-${product.id}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      kind: "price-drop",
      targetPrice: Math.max(1, Math.round(product.price * 0.9)),
      currentPrice: product.price,
      active: true,
      createdAt: new Date().toISOString(),
    });
    setActive(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-black/10 bg-white px-4 py-3 text-xs font-black transition hover:bg-black hover:text-white"
    >
      {active ? "Price alert on" : "↓ Alert me on price drop"}
    </button>
  );
}
