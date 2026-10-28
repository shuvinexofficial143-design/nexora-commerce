import type { Metadata } from "next";
import Link from "next/link";
import { CatalogShell } from "@/components/catalog/catalog-shell";
import { LiveCatalogView } from "@/components/catalog/live-catalog-view";
import { Container } from "@/components/ui/container";
import { getCatalogProducts } from "@/lib/catalog-backend";
import { loadLiveCatalog } from "@/lib/storefront/catalog-data";
import { demoCatalogEnabled, parseLiveCatalogQuery, type CatalogSearchParams } from "@/lib/storefront/catalog-query";

export const metadata: Metadata = {
  title: "Shop All | Nexora Commerce",
  description: "Browse available products across electronics, fashion, home, beauty, sports, gifts and more.",
};
export default async function ShopPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const query = parseLiveCatalogQuery(await searchParams);
  if (demoCatalogEnabled()) {
    const products = await getCatalogProducts();
    return <main className="pb-24"><Container>
      <h1 className="pt-10 text-3xl font-black tracking-tight">Shop products</h1>
      <p role="status" className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">DEMO PREVIEW ONLY — sample products and example prices. Live inventory, checkout and payments are not enabled.</p>
      <CatalogShell key={query.categories.join(",")+query.sort} products={products}
        initialCategory={query.categories[0]} initialSort={query.sort} />
    </Container></main>;
  }
  let data: Awaited<ReturnType<typeof loadLiveCatalog>> | null = null;
  try { data = await loadLiveCatalog(query); }
  catch (error) { console.error("NEXORA live catalog unavailable", error instanceof Error ? error.message : "Database error"); }
  return <main className="pb-24 pt-8"><Container>
    <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Shop all products</h1>
    <p className="mt-3 text-sm leading-6 text-black/55">Explore products published by the store. Prices and availability come from the live catalog.</p>
    {data ? <LiveCatalogView query={query} data={data} path="/shop" /> :
      <section role="status" className="mt-8 rounded-[24px] border border-black/10 bg-white p-8">
        <h2 className="text-xl font-black">The product catalog is temporarily unavailable.</h2>
        <p className="mt-2 text-sm text-black/50">Please retry shortly. We do not show demonstration inventory as real stock.</p>
        <Link href="/shop" className="mt-5 inline-block rounded-full bg-black px-5 py-3 text-sm font-black text-white">Retry shop</Link>
      </section>}
  </Container></main>;
}
