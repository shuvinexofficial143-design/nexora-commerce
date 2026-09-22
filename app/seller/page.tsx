import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerKpiGrid } from "@/components/seller/seller-kpi-grid";
import { getCurrentSession } from "@/lib/auth/session";
import { getSellerAccountProfile } from "@/lib/db/seller-profile";
import type { SellerKpi } from "@/types/seller";

export default async function SellerPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/seller");

  const profile = await getSellerAccountProfile(session.user.id);
  const storeName = profile?.storeName || session.user.name;
  const verification = profile?.verificationStatus ?? "PENDING";
  const payoutStatus = profile?.payoutStatus ?? "HOLD";
  const commissionBps = profile?.commissionBps ?? 1000;
  const gstReady = Boolean(profile?.gstNumber);

  const kpis: SellerKpi[] = [
    {
      label: "Verification",
      value: verification,
      detail: "Marketplace seller status",
      trend: verification === "VERIFIED" ? "Ready" : "Action",
    },
    {
      label: "Payouts",
      value: payoutStatus,
      detail: "Settlement account state",
      trend: payoutStatus === "ACTIVE" ? "Active" : "Review",
    },
    {
      label: "Commission",
      value: `${(commissionBps / 100).toFixed(2)}%`,
      detail: "Current marketplace rate",
      trend: "Live",
    },
    {
      label: "GST profile",
      value: gstReady ? "Linked" : "Pending",
      detail: gstReady ? profile!.gstNumber : "Add GSTIN in profile",
      trend: gstReady ? "Ready" : "Setup",
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
            Manage your seller identity, marketplace readiness and upcoming commerce operations.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/seller/profile"
            className="rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-black"
          >
            Seller profile
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-[28px] border border-black/10 bg-white p-6">
          <p className="text-xs font-black uppercase tracking-[.18em] text-black/40">
            Marketplace readiness
          </p>
          <h3 className="mt-3 text-2xl font-black">
            {verification === "VERIFIED" ? "Seller identity is verified." : "Seller setup needs attention."}
          </h3>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-black/50">
            Store identity now comes from your database-backed seller profile. Verification,
            payout state and commission are no longer hardcoded demo values.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <StatusRow label="Store" value={storeName} />
            <StatusRow label="Owner" value={profile?.ownerName || session.user.name} />
            <StatusRow label="Verification" value={verification} />
            <StatusRow label="Payout" value={payoutStatus} />
          </div>
        </section>

        <section className="rounded-[28px] bg-[#121613] p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[.18em] text-white/45">
            Sales data
          </p>
          <h3 className="mt-3 text-2xl font-black">Seller-linked commerce is the next layer.</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-white/55">
            Sales, orders and inventory should only appear after products are linked to a specific
            seller. Until that ownership relation is added, NEXORA will not show misleading global
            marketplace numbers as seller data.
          </p>
          <Link
            href="/seller/products"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-black"
          >
            Open products
          </Link>
        </section>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/[.035] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-black/35">{label}</p>
      <p className="mt-2 break-words text-sm font-black">{value}</p>
    </div>
  );
}
