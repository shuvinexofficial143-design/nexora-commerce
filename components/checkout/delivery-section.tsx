import { DeliveryOptionCard } from "@/components/checkout/delivery-option-card";
import type { DeliveryMethodId, DeliveryOption } from "@/types/checkout";

export function DeliverySection({ options, selectedId, onSelect }: { options: DeliveryOption[]; selectedId: DeliveryMethodId; onSelect: (id: DeliveryMethodId) => void }) {
  return <section className="rounded-[30px] border border-black/10 bg-white p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-[.16em] text-black/35">02 · Delivery</p><h2 className="mt-1 text-xl font-black">Choose your speed</h2><div className="mt-5 grid gap-3">{options.map((option) => <DeliveryOptionCard key={option.id} option={option} selected={option.id === selectedId} onSelect={() => onSelect(option.id)} />)}</div></section>;
}
