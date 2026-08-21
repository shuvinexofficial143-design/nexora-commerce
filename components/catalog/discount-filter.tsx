type DiscountFilterProps = {
  value: number;
  onChange: (value: number) => void;
};

const discounts = [0, 10, 20, 30, 40];

export function DiscountFilter({ value, onChange }: DiscountFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {discounts.map((discount) => (
        <button
          key={discount}
          type="button"
          onClick={() => onChange(discount)}
          className={`rounded-full border px-3 py-2 text-xs font-black ${value === discount ? "border-black bg-black text-white" : "border-black/10 bg-white text-black/65"}`}
        >
          {discount === 0 ? "Any" : `${discount}%+ off`}
        </button>
      ))}
    </div>
  );
}
