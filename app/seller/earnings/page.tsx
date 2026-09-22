import { redirect } from "next/navigation";
import { SellerEarningsChart } from "@/components/seller/seller-earnings-chart";
import { getCurrentSession } from "@/lib/auth/session";
import { getSellerEarnings } from "@/lib/db/seller-commerce";

const money = (minor: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);

export default async function Page() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/seller/earnings");

  const earnings = await getSellerEarnings(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/40">
          Money
        </p>
        <h2 className="mt-2 text-3xl font-black">Earnings</h2>
        <p className="mt-2 text-sm text-black/55">
          Seller-owned order value and marketplace commission calculated from the database.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Gross this month" value={money(earnings.grossMinor)} />
        <Stat label="Commission" value={money(earnings.commissionMinor)} />
        <Stat label="Returned / refunded" value={money(earnings.adjustmentsMinor)} />
        <Stat label="Estimated net" value={money(earnings.netMinor)} />
      </div>

      <SellerEarningsChart data={earnings.salesSeries} />

      <section className="rounded-[28px] border border-black/10 bg-white p-5">
        <h3 className="text-xl font-black">Fee calculation</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Stat
            label="Marketplace commission rate"
            value={`${(earnings.commissionBps / 100).toFixed(2)}%`}
          />
          <div className="rounded-[22px] bg-[#f7f7f3] p-4">
            <p className="text-xs font-bold text-black/45">Calculation basis</p>
            <p className="mt-2 text-sm font-black leading-6">
              Seller-owned order items only. Cancelled, returned and refunded orders are excluded
              from gross sales; returned/refunded value is shown separately.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-[#f7f7f3] p-4">
      <p className="text-xs font-bold text-black/45">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
