import type { StockStatus } from "@/types/catalog";

type StockValue = "all" | StockStatus;

type StockFilterProps = {
  value: StockValue;
  onChange: (value: StockValue) => void;
};

const options: Array<{ value: StockValue; label: string }> = [
  { value: "all", label: "All availability" },
  { value: "in-stock", label: "In stock" },
  { value: "low-stock", label: "Low stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

export function StockFilter({ value, onChange }: StockFilterProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-black/70">
          <input type="radio" name="stock" checked={value === option.value} onChange={() => onChange(option.value)} className="accent-black" />
          {option.label}
        </label>
      ))}
    </div>
  );
}
