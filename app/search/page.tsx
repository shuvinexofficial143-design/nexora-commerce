import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SearchBar } from "@/components/search/search-bar";
import { catalogProducts } from "@/lib/catalog-data";
import {
  demoSearchEnabled, normalizeSearchPage, normalizeStoreSearch, searchStoreProducts,
  searchTerms, SEARCH_PAGE_SIZE,
} from "@/lib/storefront/product-discovery";
import type { CatalogProduct } from "@/types/catalog";

export const metadata: Metadata = {
  title: "Search Products | NEXORA",
  description: "Search active Nexora products by product name, category, brand and features.",
};
export const dynamic = "force-dynamic";

type Results = { products: CatalogProduct[]; total: number; page: number; totalPages: number };

function localDemoSearch(query: string, page: number, availableOnly: boolean): Results {
  const words = searchTerms(query);
  const matched = catalogProducts.filter((product) => words.every((term) =>
    [product.name, product.brand, product.category, ...product.tags].join(" ").toLowerCase().includes(term),
  ) && (!availableOnly || product.inventory > 0));
  const totalPages = Math.ceil(matched.length / SEARCH_PAGE_SIZE);
  const safePage = totalPages ? Math.min(page, totalPages) : 1;
  return { products: matched.slice((safePage - 1) * SEARCH_PAGE_SIZE, safePage * SEARCH_PAGE_SIZE), total: matched.length, page: safePage, totalPages };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; stock?: string }>;
}) {
  const params = await searchParams;
  const query = normalizeStoreSearch(params.q);
  const page = normalizeSearchPage(params.page);
  const availableOnly = params.stock === "available";
  const canSearch = searchTerms(query).length > 0;
  let results: Results = { products: [], total: 0, page: 1, totalPages: 0 };
  let unavailable = false;

  if (canSearch) {
    if (demoSearchEnabled()) {
      // Explicit isolated CI/demo mode only, never a fallback for a live DB failure.
      results = localDemoSearch(query, page, availableOnly);
    } else {
      try { results = await searchStoreProducts(query, page, { availableOnly }); }
      catch (error) {
        console.warn("NEXORA live search unavailable", error instanceof Error ? error.name : "unknown");
        unavailable = true;
      }
    }
  }

  const baseHref = "/search?q=" + encodeURIComponent(query);
  const filterHref = baseHref + (availableOnly ? "" : "&stock=available");
  const pageHref = (target: number) =>
    baseHref + (availableOnly ? "&stock=available" : "") + "&page=" + target;

  return (
    <main className="pb-24 pt-8">
      <Container>
        <h1 className="text-3xl font-black tracking-[-.05em] sm:text-5xl">Search Nexora</h1>
        <div className="mt-6 max-w-2xl"><SearchBar initialQuery={query} /></div>
        {canSearch ? (
          <nav aria-label="Search stock filters" className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={filterHref}
              className={`rounded-full border px-4 py-2 text-sm font-bold ${availableOnly ? "border-black bg-black text-white" : "border-black/15 bg-white text-black"}`}>
              {availableOnly ? "✓ Available only · Clear filter" : "Show available products only"}
            </Link>
            {!demoSearchEnabled()?<Link href={"/shop?q="+encodeURIComponent(query)}
              className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-bold">Advanced specification filters →</Link>:null}
            {demoSearchEnabled() ? <span className="text-xs font-medium text-black/50">Preview results only — stock not live.</span> : null}
          </nav>
        ) : null}

        {!canSearch ? (
          <section className="mt-7 max-w-xl rounded-3xl border border-black/10 bg-white p-7">
            <h2 className="text-lg font-black">Find what you need</h2>
            <p className="mt-2 text-sm leading-6 text-black/60">Search by product name, category, brand or SKU. Enter at least two characters.</p>
            <Link href="/shop" className="mt-5 inline-block rounded-full bg-[#d7ff47] px-5 py-3 text-sm font-black">Browse shop</Link>
          </section>
        ) : unavailable ? (
          <section role="alert" className="mt-7 rounded-3xl border border-amber-200 bg-amber-50 p-7">
            <h2 className="font-black">Product search is temporarily unavailable</h2>
            <p className="mt-2 text-sm text-black/60">We could not check our live catalog. Please try again shortly.</p>
            <Link href="/search" className="mt-4 inline-block rounded-full bg-black px-5 py-3 text-sm font-black text-white">Try another search</Link>
          </section>
        ) : (
          <>
            <p role="status" className="mt-7 text-sm font-bold text-black/55">
              {results.total.toLocaleString("en-IN")} result{results.total === 1 ? "" : "s"} for “{query}”
              {results.totalPages > 1 ? ` · Page ${results.page} of ${results.totalPages}` : ""}
            </p>
            {results.products.length ? (
              <section className="mt-6" aria-label="Search results">
                <ProductGrid products={results.products} view="grid" />
                {results.totalPages > 1 ? (
                  <nav aria-label="Search results pagination" className="mt-9 flex flex-wrap items-center justify-center gap-3">
                    {results.page > 1 ? (
                      <Link href={pageHref(results.page - 1)} className="rounded-full border border-black/15 px-5 py-3 text-sm font-black">← Previous</Link>
                    ) : null}
                    <span className="rounded-full bg-black/5 px-5 py-3 text-sm font-bold">{results.page} / {results.totalPages}</span>
                    {results.page < results.totalPages ? (
                      <Link href={pageHref(results.page + 1)} className="rounded-full bg-black px-5 py-3 text-sm font-black text-white">Next →</Link>
                    ) : null}
                  </nav>
                ) : null}
              </section>
            ) : (
              <section className="mt-6 rounded-3xl bg-white p-8">
                <h2 className="font-black">No matching products found.</h2>
                <p className="mt-2 text-sm text-black/50">Try another keyword or browse all products.</p>
                <Link href="/shop" className="mt-4 inline-block rounded-full bg-[#d7ff47] px-5 py-3 text-sm font-black">Browse shop</Link>
              </section>
            )}
          </>
        )}
      </Container>
    </main>
  );
}
