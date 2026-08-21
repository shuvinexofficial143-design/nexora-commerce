type PriceRangeFilterProps = {
  min: number;
  max: number;
  floor: number;
  ceiling: number;
  onChange: (min: number, max: number) => void;
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function PriceRangeFilter({ min, max, floor, ceiling, onChange }: PriceRangeFilterProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs font-black">
        <span>{money.format(min)}</span>
        <span>{money.format(max)}</span>
      </div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-black/40">Minimum</label>
      <input
        aria-label="Minimum price"
        type="range"
        min={floor}
        max={ceiling}
        step={500}
        value={min}
        onChange={(event) => onChange(Math.min(Number(event.target.value), max), max)}
        className="mt-1 w-full accent-black"
      />
      <label className="mt-3 block text-[11px] font-bold uppercase tracking-wider text-black/40">Maximum</label>
      <input
        aria-label="Maximum price"
        type="range"
        min={floor}
        max={ceiling}
        step={500}
        value={max}
        onChange={(event) => onChange(min, Math.max(Number(event.target.value), min))}
        className="mt-1 w-full accent-black"
      />
    </div>
  );
}
