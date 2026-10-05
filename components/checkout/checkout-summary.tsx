"use client";

import { useCart } from "@/components/cart/cart-provider";
import { PromoSummary } from "@/components/checkout/promo-summary";
import { SecureCheckoutNote } from "@/components/checkout/secure-checkout-note";
import { currency } from "@/lib/cart-utils";
import type { DeliveryOption, PaymentMethodId } from "@/types/checkout";

export function CheckoutSummary({ delivery, paymentId, placing, onPlaceOrder, onReview }: { delivery: DeliveryOption; paymentId: PaymentMethodId; placing: boolean; onPlaceOrder: () => void; onReview: () => void }) {
  const { totals, coupon } = useCart();
  const finalTotal = totals.total - totals.shipping + delivery.price;
  return <aside className="rounded-[30px] border border-black/10 bg-white p-5 shadow-[0_20px_70px_rgba(17,17,15,.06)] lg:sticky lg:top-28"><p className="text-xs font-black uppercase tracking-[.16em] text-black/35">Payable now</p><div className="mt-2 flex items-end justify-between gap-4"><h2 className="text-xl font-black">Order total</h2><p className="text-3xl font-black tracking-[-.05em]">{currency.format(finalTotal)}</p></div><dl className="mt-6 space-y-3 text-sm"><Row label="Items" value={currency.format(totals.subtotal)} /><Row label="Discount" value={totals.discount ? `−${currency.format(totals.discount)}` : "—"} good={totals.discount > 0} /><Row label="Delivery" value={delivery.price ? currency.format(delivery.price) : "FREE"} /><Row label="Estimated tax" value={currency.format(totals.tax)} /></dl><div className="my-5 border-t border-black/10" /><PromoSummary coupon={coupon} /><button type="button" onClick={() => { onReview(); onPlaceOrder(); }} disabled={placing} className="mt-5 w-full rounded-full bg-[#D7FF47] px-5 py-4 text-sm font-black text-black transition hover:bg-[#D7FF47]/80 disabled:cursor-wait disabled:opacity-55">{placing ? (paymentId === "cashfree" ? "Opening Cashfree…" : "Placing secure order…") : `${paymentId === "cashfree" ? "Continue to Cashfree" : "Place COD order"} · ${currency.format(finalTotal)}`}</button><SecureCheckoutNote /></aside>;
}
function Row({ label, value, good = false }: { label: string; value: string; good?: boolean }) { return <div className="flex justify-between gap-4"><dt className="font-bold text-black/45">{label}</dt><dd className={`font-black ${good ? "text-emerald-700" : ""}`}>{value}</dd></div>; }


