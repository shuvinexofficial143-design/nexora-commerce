const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function Price({ amount, compareAt }: { amount: number; compareAt?: number }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <strong>{currency.format(amount)}</strong>
      {compareAt ? <span className="text-xs font-bold text-black/35 line-through">{currency.format(compareAt)}</span> : null}
    </div>
  );
}
