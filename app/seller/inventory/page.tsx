import { redirect } from "next/navigation";
import { SellerInventoryTable } from "@/components/seller/seller-inventory-table";
import { getCurrentSession } from "@/lib/auth/session";
import { listSellerInventory } from "@/lib/db/seller-commerce";

export default async function Page() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/seller/inventory");

  const inventory = await listSellerInventory(session.user.id);
  const attention = inventory.filter((item) => item.status !== "Healthy").length;
  const out = inventory.filter((item) => item.status === "Out").length;
  const sellable = inventory.reduce((sum, item) => sum + item.available, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/40">
          Stock control
        </p>
        <h2 className="mt-2 text-3xl font-black">Inventory</h2>
        <p className="mt-2 text-sm text-black/55">
          Real warehouse inventory for this seller&apos;s owned products.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sellable units" value={String(sellable)} />
        <Stat label="Low / critical SKUs" value={String(attention - out)} />
        <Stat label="Out of stock" value={String(out)} />
      </div>

      <SellerInventoryTable items={inventory} />
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
