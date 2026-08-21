import {SellerAnalyticsPanels} from "@/components/seller/seller-analytics-panels";
import {SellerEarningsChart} from "@/components/seller/seller-earnings-chart";
import {sellerSalesSeries} from "@/lib/seller-data";
export default function Page(){return <div className="space-y-6"><div><p className="text-xs font-black uppercase tracking-[.18em] text-black/40">Insights</p><h2 className="mt-2 text-3xl font-black">Seller analytics</h2><p className="mt-2 text-sm text-black/55">Understand traffic, conversion, product mix and weekly momentum.</p></div><SellerEarningsChart data={sellerSalesSeries}/><SellerAnalyticsPanels/></div>}
