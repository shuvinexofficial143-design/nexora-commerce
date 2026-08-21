import type { CheckoutAddress } from "@/types/checkout";

export function AddressCard({ address, selected, onSelect }: { address: CheckoutAddress; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`relative rounded-[24px] border p-4 text-left transition ${selected ? "border-black bg-black text-white" : "border-black/10 bg-[#f8f8f6] hover:border-black/25"}`}>
      <span className={`absolute right-4 top-4 h-4 w-4 rounded-full border-4 ${selected ? "border-[#d7ff47] bg-black" : "border-white bg-black/15"}`} />
      <p className="text-xs font-black uppercase tracking-[.14em] opacity-50">{address.label}</p><p className="mt-2 font-black">{address.fullName}</p>
      <p className="mt-1 max-w-[34ch] text-sm font-bold opacity-65">{address.line1}, {address.city}, {address.state} {address.postalCode}</p><p className="mt-2 text-xs font-black opacity-55">{address.phone}</p>
    </button>
  );
}
