import type { PaymentMethod } from "@/types/checkout";

export function PaymentMethodCard({ method, selected, onSelect }: { method: PaymentMethod; selected: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={`rounded-[22px] border p-4 text-left transition ${selected ? "border-black bg-[#d7ff47]" : "border-black/10 bg-[#f8f8f6] hover:border-black/25"}`}><div className="flex items-center justify-between"><span className="text-2xl">{method.icon}</span><span className={`h-4 w-4 rounded-full border-4 ${selected ? "border-black bg-[#d7ff47]" : "border-white bg-black/15"}`} /></div><p className="mt-3 font-black">{method.label}</p><p className="mt-1 text-xs font-bold text-black/45">{method.description}</p></button>;
}
