import type { SellerInventory } from "@/types/seller";

export function SellerInventoryTable({ items }: { items: SellerInventory[] }) {
  return (
    <section className="rounded-[28px] border border-black/10 bg-white p-4 sm:p-5">
      <div className="mb-5">
        <h2 className="text-xl font-black">Inventory health</h2>
        <p className="text-sm text-black/50">
          Available units after real marketplace reservations.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-black/40">
            <tr>
              <th className="pb-3">Product</th>
              <th className="pb-3">On hand</th>
              <th className="pb-3">Reserved</th>
              <th className="pb-3">Available</th>
              <th className="pb-3">Reorder at</th>
              <th className="pb-3">Health</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sku} className="border-t border-black/8">
                <td className="py-4">
                  <p className="font-black">{item.product}</p>
                  <p className="text-xs text-black/40">{item.sku}</p>
                </td>
                <td className="py-4 font-bold">{item.onHand}</td>
                <td className="py-4 font-bold">{item.reserved}</td>
                <td className="py-4 font-black">{item.available}</td>
                <td className="py-4 text-black/60">{item.reorderAt}</td>
                <td className="py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-black ${
                      item.status === "Healthy"
                        ? "bg-[#e9ffe9] text-green-800"
                        : item.status === "Out"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}

            {!items.length ? (
              <tr>
                <td colSpan={6} className="border-t border-black/8 py-12 text-center">
                  <p className="text-lg font-black">No inventory rows yet.</p>
                  <p className="mt-2 text-sm font-bold text-black/45">
                    Inventory will appear after stock is assigned to seller-owned products.
                  </p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
