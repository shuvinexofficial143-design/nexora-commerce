import { redirect } from "next/navigation";
import { SellerAnalyticsPanels } from "@/components/seller/seller-analytics-panels";
import { SellerEarningsChart } from "@/components/seller/seller-earnings-chart";
import { getCurrentSession } from "@/lib/auth/session";
import { getSellerAnalytics, getSellerEarnings } from "@/lib/db/seller-commerce";

export default async function Page() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/seller/analytics");

  const [earnings, analytics] = await Promise.all([
    getSellerEarnings(session.user.id),
    getSellerAnalytics(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[.18em] text-black/40">
          Insights
        </p>
        <h2 className="mt-2 text-3xl font-black">Seller analytics</h2>
        <p className="mt-2 text-sm text-black/55">
          Real seller order momentum, fulfillment mix and top-performing products.
        </p>
      </div>

      <SellerEarningsChart data={earnings.salesSeries} />
      <SellerAnalyticsPanels
        orderStatuses={analytics.orderStatuses}
        topProducts={analytics.topProducts}
      />
    </div>
  );
}
