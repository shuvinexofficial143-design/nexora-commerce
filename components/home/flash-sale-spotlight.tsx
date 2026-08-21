import Link from "next/link";
import { Container } from "@/components/ui/container";
import { FlashSaleProductCard } from "@/components/engagement/flash-sale-product-card";
import { flashSaleItems } from "@/lib/engagement-data";
export function FlashSaleSpotlight(){return <section className="bg-[#f1f1ed] py-14"><Container><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-black/35">Limited drop</p><h2 className="mt-2 text-4xl font-black tracking-[-.05em]">Flash sale is live</h2><p className="mt-2 max-w-xl text-sm font-bold text-black/45">Claim-limited offers with member reward points.</p></div><Link href="/deals/flash-sale" className="text-sm font-black">See live sale →</Link></div><div className="grid gap-5 md:grid-cols-3">{flashSaleItems.slice(0,3).map(sale=><FlashSaleProductCard key={sale.productId} sale={sale}/>)}</div></Container></section>}
