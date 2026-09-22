type SellerAnalyticsPanelsProps = {
  orderStatuses: Array<{ label: string; count: number }>;
  topProducts: Array<{ name: string; units: number; revenue: number }>;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export function SellerAnalyticsPanels({
  orderStatuses,
  topProducts,
}: SellerAnalyticsPanelsProps) {
  const totalOrders = orderStatuses.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-[28px] border border-black/10 bg-white p-5">
        <h2 className="text-xl font-black">Order pipeline</h2>
        <p className="text-sm text-black/50">
          Current-month seller orders grouped by fulfillment status.
        </p>

        <div className="mt-5 space-y-3">
          {orderStatuses.map((item) => (
            <div key={item.label} className="rounded-2xl bg-[#f7f7f3] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black">{item.label}</p>
                <p className="text-sm font-black">{item.count}</p>
              </div>
              <p className="mt-1 text-xs font-bold text-black/40">
                {totalOrders
                  ? String(Math.round((item.count / totalOrders) * 100)) + "% of seller orders"
                  : "No seller orders this month"}
              </p>
            </div>
          ))}

          {!orderStatuses.length ? (
            <div className="rounded-2xl bg-[#f7f7f3] p-5 text-sm font-bold text-black/45">
              No seller order activity yet.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-black/10 bg-white p-5">
        <h2 className="text-xl font-black">Top products</h2>
        <p className="text-sm text-black/50">
          Sales leaders from seller-owned order items this month.
        </p>

        <div className="mt-5 divide-y divide-black/8">
          {topProducts.map((product, index) => (
            <div key={product.name} className="flex items-center gap-4 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-black text-sm font-black text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black">{product.name}</p>
                <p className="text-xs text-black/45">{product.units} units sold</p>
              </div>
              <p className="font-black">{money(product.revenue)}</p>
            </div>
          ))}

          {!topProducts.length ? (
            <div className="py-8 text-center text-sm font-bold text-black/45">
              No seller product sales this month.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
