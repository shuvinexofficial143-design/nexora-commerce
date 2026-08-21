import { FREE_SHIPPING_THRESHOLD, currency } from "@/lib/cart-utils";

export function ShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  return (
    <div className="rounded-2xl bg-[#eefbc1] p-4">
      <div className="flex items-center justify-between gap-3 text-xs font-black"><span>{remaining ? `Add ${currency.format(remaining)} for free delivery` : "Free delivery unlocked ✓"}</span><span>{progress}%</span></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-black transition-all" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}
