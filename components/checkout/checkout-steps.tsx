import type { CheckoutStep } from "@/types/checkout";

const steps: { id: CheckoutStep; label: string }[] = [
  { id: 1, label: "Address" }, { id: 2, label: "Delivery" }, { id: 3, label: "Payment" }, { id: 4, label: "Review" },
];

export function CheckoutSteps({ step, onStep }: { step: CheckoutStep; onStep: (step: CheckoutStep) => void }) {
  return (
    <div className="mt-7 grid grid-cols-4 overflow-hidden rounded-[24px] border border-black/10 bg-white p-1.5">
      {steps.map((item) => (
        <button key={item.id} type="button" onClick={() => onStep(item.id)} className={`rounded-[18px] px-2 py-3 text-xs font-black transition sm:text-sm ${step === item.id ? "bg-black text-white" : "text-black/45 hover:bg-black/[.04] hover:text-black"}`}>
          <span className="hidden sm:inline">0{item.id} · </span>{item.label}
        </button>
      ))}
    </div>
  );
}
