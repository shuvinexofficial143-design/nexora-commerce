import { redirect } from "next/navigation";
import { SellerOrdersTable } from "@/components/seller/seller-orders-table";
import { getCurrentSession } from "@/lib/auth/session";
import { listSellerOrders } from "@/lib/db/seller-commerce";

export default async function Page() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/seller/orders");

  const orders = await listSellerOrders(session.user.id);

  const stats = {
    new: orders.filter((order) => order.status === "New").length,
    processing: orders.filter((order) => order.status === "Processing").length,
    packed: orders.filter((order) => order.status === "Packed").length,
    shipped: orders.filter((order) => order.status === "Shipped").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/40">
          Fulfilment
        </p>
        <h2 className="mt-2 text-3xl font-black">Orders</h2>
        <p className="mt-2 text-sm text-black/55">
          Orders are filtered to products owned by this seller account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New" value={String(stats.new)} />
        <Stat label="Processing" value={String(stats.processing)} />
        <Stat label="Packed" value={String(stats.packed)} />
        <Stat label="Shipped" value={String(stats.shipped)} />
      </div>

      <SellerOrdersTable orders={orders} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-5">
      <p className="text-sm font-bold text-black/45">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}
