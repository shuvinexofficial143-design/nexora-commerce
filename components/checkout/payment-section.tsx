import { PaymentMethodCard } from "@/components/checkout/payment-method-card";
import type { PaymentMethod, PaymentMethodId } from "@/types/checkout";

export function PaymentSection({ methods, selectedId, onSelect }: { methods: PaymentMethod[]; selectedId: PaymentMethodId; onSelect: (id: PaymentMethodId) => void }) {
  return <section className="rounded-[30px] border border-black/10 bg-white p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-[.16em] text-black/35">03 · Payment</p><h2 className="mt-1 text-xl font-black">Pay your way</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{methods.map((method) => <PaymentMethodCard key={method.id} method={method} selected={method.id === selectedId} onSelect={() => onSelect(method.id)} />)}</div><p className="mt-4 text-xs font-bold text-black/35">Demo checkout only — no real card, UPI or banking details are collected in this batch.</p></section>;
}
