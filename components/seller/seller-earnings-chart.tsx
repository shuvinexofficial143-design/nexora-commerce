export function SellerEarningsChart({
  data,
}: {
  data: { day: string; sales: number; orders: number }[];
}) {
  const max = Math.max(0, ...data.map((item) => item.sales));
  const orders = data.reduce((sum, item) => sum + item.orders, 0);
  const money = (value: number) =>
    value >= 1000 ? `₹${Math.round(value / 1000)}K` : `₹${Math.round(value)}`;

  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-5">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">7-day seller sales</h2>
          <p className="text-sm text-black/50">
            Seller-owned order value before marketplace commission.
          </p>
        </div>
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-black">
          {orders} orders
        </span>
      </div>

      <div className="flex h-56 items-end gap-3">
        {data.map((item) => (
          <div
            key={item.day}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <span className="text-[10px] font-black text-black/40">
              {money(item.sales)}
            </span>
            <div
              className="w-full rounded-t-xl bg-black"
              style={{
                height: `${max > 0 ? Math.max(12, (item.sales / max) * 160) : 12}px`,
              }}
            />
            <span className="text-xs font-bold text-black/50">{item.day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
