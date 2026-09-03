import type { CheckoutAddress } from "@/types/checkout";

export function AddressCard({ address, selected, onSelect }: { address: CheckoutAddress; selected: boolean; onSelect: () => void }) {
  const locality = [address.line1, address.areaColony, address.landmark].filter(Boolean).join(", ");
  return (
    <button type="button" onClick={onSelect} className={`relative rounded-[24px] border p-4 text-left transition ${selected ? "border-[#1f3a2e] bg-[#1f3a2e] text-white" : "border-black/10 bg-[#f8f6f0] hover:border-[#1f3a2e]/35"}`}>
      <span className={`absolute right-4 top-4 h-4 w-4 rounded-full border-4 ${selected ? "border-[#f6c453] bg-[#1f3a2e]" : "border-white bg-black/15"}`} />
      <p className="text-xs font-black uppercase tracking-[.14em] opacity-50">{address.label}</p>
      <p className="mt-2 font-black">{address.fullName}</p>
      <p className="mt-1 max-w-[38ch] text-sm font-bold leading-5 opacity-65">{locality}, {address.city}, {address.state} — {address.postalCode}</p>
      <p className="mt-2 text-xs font-black opacity-60">+91 {address.phone}</p>
    </button>
  );
}
