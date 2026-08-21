import { currency } from "@/lib/cart-utils";
import type { DeliveryOption } from "@/types/checkout";

export function DeliveryOptionCard({ option, selected, onSelect }: { option: DeliveryOption; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`flex items-center justify-between gap-4 rounded-[22px] border p-4 text-left transition ${selected ? "border-black bg-black text-white" : "border-black/10 bg-[#f8f8f6] hover:border-black/25"}`}><div><div className="flex flex-wrap items-center gap-2"><p className="font-black">{option.label}</p>{option.badge && <span className="rounded-full bg-[#d7ff47] px-2 py-1 text-[10px] font-black text-black">{option.badge}</span>}</div><p className="mt-1 text-xs font-bold opacity-55">{option.eta}</p></div><p className="text-sm font-black">{option.price === 0 ? "FREE" : currency.format(option.price)}</p></button>;
}
