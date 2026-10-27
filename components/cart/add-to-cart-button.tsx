"use client";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { CartProductSnapshot } from "@/types/cart";
type AddOptions = { color?: string; size?: string; quantity?: number; choices?: Record<string,string> };
export function AddToCartButton({ product, label = "Add to bag", className = "", options, verifyLive = false }: {
  product: CartProductSnapshot; label?: string; className?: string; options?: AddOptions; verifyLive?: boolean;
}) {
  const { addItem, addVerifiedItem } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unavailable = product.stock === "out-of-stock";
  async function add() {
    if (unavailable || busy) return;
    setError("");
    if (!verifyLive) { addItem(product, options); return; }
    setBusy(true);
    try { await addVerifiedItem(product, options); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Could not verify this SKU."); }
    finally { setBusy(false); }
  }
  return <div className="min-w-0">
    <button type="button" disabled={unavailable || busy} onClick={() => void add()}
      className={className || "rounded-full bg-[#D7FF47] px-4 py-2.5 text-xs font-black text-black disabled:bg-black/20"}>
      {unavailable ? "Unavailable" : busy ? "Verifying SKU…" : label}
    </button>
    {error ? <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}
  </div>;
}
