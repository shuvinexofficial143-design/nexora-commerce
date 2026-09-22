import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerEarningsChart } from "@/components/seller/seller-earnings-chart";
import { SellerKpiGrid } from "@/components/seller/seller-kpi-grid";
import { SellerOrdersTable } from "@/components/seller/seller-orders-table";
import { getCurrentSession } from "@/lib/auth/session";
import {
  getSellerEarnings,
  listSellerInventory,
  listSellerOrders,
} from "@/lib/db/seller-commerce";
import { getSellerAccountProfile } from "@/lib/db/seller-profile";
import type { SellerKpi } from "@/types/seller";

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);

export default async function SellerPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/seller");

  const [profile, orders, inventory, earnings] = await Promise.all([
    getSellerAccountProfile(session.user.id),
    listSellerOrders(session.user.id),
    listSellerInventory(session.user.id),
    getSellerEarnings(session.user.id),
  ]);

  const storeName = profile?.storeName || session.user.name;
  const verification = profile?.verificationStatus ?? "PENDING";
  const sellable = inventory.reduce((sum, item) => sum + item.available, 0);
  const attention = inventory.filter((item) => item.status !== "Healthy").length;
  const openOrders = orders.filter((order) =>
    ["New", "Processing", "Packed", "Shipped"].includes(order.status),
  ).length;

  const kpis: SellerKpi[] = [
    {
      label: "Gross sales",
      value: money(earnings.grossMinor),
      detail: "Seller-owned orders this month",
      trend: "Live",
    },
    {
      label: "Open orders",
      value: String(openOrders),
      detail: String(orders.length) + " seller orders loaded",
      trend: "Queue",
    },
    {
      label: "Sellable units",
      value: String(sellable),
      detail: String(attention) + " SKUs need attention",
      trend: "Stock",
    },
    {
      label: "Verification",
      value: verification,
      detail: "Marketplace seller status",
      trend: verification === "VERIFIED" ? "Ready" : "Action",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-black/40">
            Marketplace command center
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Welcome, {storeName}.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            Sales, orders, inventory and seller readiness are now calculated from your database.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/seller/orders"
            className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-black"
          >
            View orders
          </Link>
          <Link
            href="/seller/products"
            className="rounded-full bg-black px-4 py-3 text-sm font-black text-white"
          >
            + Add product
          </Link>
        </div>
      </div>

      <SellerKpiGrid items={kpis} />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <SellerEarningsChart data={earnings.salesSeries} />

        <section className="rounded-[28px] bg-[#121613] p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[.18em] text-white/45">
            Seller health
          </p>
          <h3 className="mt-3 text-2xl font-black">
            {verification === "VERIFIED" ? "Verified seller account" : "Setup needs attention"}
          </h3>

          <div className="mt-6 space-y-3 text-sm font-bold">
            <StatusRow label="Verification" value={verification} />
            <StatusRow label="Payout" value={profile?.payoutStatus ?? "HOLD"} />
            <StatusRow
              label="Commission"
              value={((profile?.commissionBps ?? 1000) / 100).toFixed(2) + "%"}
            />
            <StatusRow
              label="GST"
              value={profile?.gstNumber ? "Linked" : "Pending"}
            />
          </div>

          <Link
            href="/seller/profile"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-black"
          >
            Manage profile
          </Link>
        </section>
      </div>

      <SellerOrdersTable orders={orders.slice(0, 6)} />
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/8 px-4 py-3">
      <span className="text-white/55">{label}</span>
      <span>{value}</span>
    </div>
  );
}
