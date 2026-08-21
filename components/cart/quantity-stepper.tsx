"use client";

export function QuantityStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-black/10 bg-white p-1" aria-label="Quantity selector">
      <button type="button" onClick={() => onChange(value - 1)} className="grid h-8 w-8 place-items-center rounded-full text-lg font-bold hover:bg-black/5" aria-label="Decrease quantity">−</button>
      <span className="min-w-8 text-center text-sm font-black">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className="grid h-8 w-8 place-items-center rounded-full text-lg font-bold hover:bg-black/5" aria-label="Increase quantity">+</button>
    </div>
  );
}
