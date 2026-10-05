import type { PaymentMethod } from "@/types/checkout";

export function PaymentMethodCard({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
}) {
  const available = method.available !== false;

  return (
    <button
      type="button"
      disabled={!available}
      onClick={onSelect}
      className={`rounded-[22px] border p-4 text-left transition ${
        !available
          ? "cursor-not-allowed border-black/8 bg-[#f3f3f0] opacity-55"
          : selected
            ? "border-black bg-[#d7ff47]"
            : "border-black/10 bg-[#f8f8f6] hover:border-black/25"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl">{method.icon}</span>
        <div className="flex items-center gap-2">
          {method.badge ? (
            <span className="rounded-full bg-black/5 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-black/50">
              {method.badge}
            </span>
          ) : null}
          <span
            className={`h-4 w-4 rounded-full border-4 ${
              selected && available ? "border-black bg-[#d7ff47]" : "border-white bg-black/15"
            }`}
          />
        </div>
      </div>
      <p className="mt-3 font-black">{method.label}</p>
      <p className="mt-1 text-xs font-bold text-black/45">{method.description}</p>
    </button>
  );
}
