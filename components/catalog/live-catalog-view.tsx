import Link from "next/link";
import { ProductGrid } from "@/components/catalog/product-grid";
import { mapBackendProductToCatalog } from "@/lib/catalog-backend";
import { catalogPageHref, type LiveCatalogQuery } from "@/lib/storefront/catalog-query";
import type { BackendProduct } from "@/types/backend";

type Facet = { slug: string; name: string };
export type LiveCatalogData = {
  items: BackendProduct[];
  total: number;
  limit: number;
  offset: number;
  facets: { categories: Facet[]; brands: Facet[] };
};
const money = (amount: number) => (amount / 100).toFixed(0);
export function LiveCatalogView({
  query, data, path,
}: {
  query: LiveCatalogQuery;
  data: LiveCatalogData;
  path: "/shop" | "/search";
}) {
  const pageCount = Math.max(1, Math.ceil(data.total / data.limit));
  const page = Math.min(Math.floor(data.offset / data.limit) + 1, pageCount);
  const pages = [...new Set([1, page - 2, page - 1, page, page + 1, page + 2, pageCount]
    .filter((value) => value >= 1 && value <= pageCount))].sort((a, b) => a - b);
  const first = data.total === 0 ? 0 : data.offset + 1;
  const last = Math.min(data.offset + data.items.length, data.total);
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-[24px] border border-black/10 bg-white p-5 lg:sticky lg:top-28 lg:self-start">
        <h2 className="text-lg font-black">Find your products</h2>
        <p className="mt-1 text-xs text-black/50">Filter products available in our live catalog.</p>
        <form method="get" action={path} className="mt-5 space-y-5">
          <label className="block text-xs font-black">Search products
            <input type="search" name="q" maxLength={100} defaultValue={query.query}
              placeholder="Name, SKU, brand…" className="mt-2 w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-black" />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-xs font-black uppercase tracking-wide text-black/60">Categories</legend>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {data.facets.categories.map((c) => (
                <label key={c.slug} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="category" value={c.slug} defaultChecked={query.categories.includes(c.slug)}
                    className="accent-black" />{c.name}
                </label>
              ))}
              {!data.facets.categories.length && <p className="text-xs text-black/40">No active categories yet.</p>}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-xs font-black uppercase tracking-wide text-black/60">Brands</legend>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {data.facets.brands.map((b) => (
                <label key={b.slug} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="brand" value={b.slug} defaultChecked={query.brands.includes(b.slug)}
                    className="accent-black" />{b.name}
                </label>
              ))}
              {!data.facets.brands.length && <p className="text-xs text-black/40">No active brands yet.</p>}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-xs font-black uppercase tracking-wide text-black/60">Price range (₹)</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-black/50">Min
                <input name="min" type="number" min="0" step="1" max="1000000"
                  defaultValue={query.minPrice === null ? "" : money(query.minPrice)}
                  placeholder="0" className="mt-1 w-full rounded-xl border border-black/15 px-2 py-2 text-sm" />
              </label>
              <label className="text-xs text-black/50">Max
                <input name="max" type="number" min="0" step="1" max="1000000"
                  defaultValue={query.maxPrice === null ? "" : money(query.maxPrice)}
                  placeholder="Any" className="mt-1 w-full rounded-xl border border-black/15 px-2 py-2 text-sm" />
              </label>
            </div>
          </fieldset>
          <label className="block text-xs font-black uppercase tracking-wide text-black/60">
            Minimum rating
            <select name="rating" defaultValue={query.minRating ?? ""}
              className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm">
              <option value="">All ratings</option>
              {[4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}+ stars</option>)}
            </select>
          </label>
          <label className="block text-xs font-black uppercase tracking-wide text-black/60">
            Availability
            <select name="stock" defaultValue={query.stock ?? ""}
              className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm">
              <option value="">All published products</option>
              <option value="available">Available to buy (1+ units)</option>
              <option value="low-stock">Low stock (1–8 units)</option>
              <option value="out-of-stock">Out of stock</option>
            </select>
          </label>
          <label className="block text-xs font-black uppercase tracking-wide text-black/60">
            Sort by
            <select name="sort" defaultValue={query.sort} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm">
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="rating">Highest rated</option>
            </select>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-full bg-black px-4 py-3 text-sm font-black text-white">Apply filters</button>
            <Link href={path} className="rounded-full border border-black/15 px-4 py-3 text-sm font-black">Reset</Link>
          </div>
        </form>
      </aside>
      <section aria-label="Live product results" className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-black/10 bg-white p-4">
          <p className="text-sm font-bold text-black/65">
            {data.total === 0 ? "No matching products" : `Showing ${first}–${last} of ${data.total} products`}
          </p>
          <span className="text-xs font-black uppercase tracking-wide text-black/45">Live catalog</span>
        </div>
        {data.items.length ? (
          <ProductGrid products={data.items.map(mapBackendProductToCatalog)} view="grid" />
        ) : (
          <div className="rounded-[24px] border border-black/10 bg-white p-10 text-center">
            <h2 className="text-xl font-black">{data.facets.categories.length ? "No products match these filters" : "No products published yet"}</h2>
            <p className="mt-2 text-sm text-black/50">Try a different search, category, price or brand.</p>
            <Link href={path} className="mt-5 inline-flex rounded-full bg-[#d7ff47] px-5 py-3 text-sm font-black">Show all products</Link>
          </div>
        )}
        {pageCount > 1 && (
          <nav aria-label="Product pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {page > 1 && <Link href={catalogPageHref(path, query, page - 1)} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black">Previous</Link>}
            {pages.map((number) => (
              <Link key={number} href={catalogPageHref(path, query, number)} aria-current={page === number ? "page" : undefined}
                className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black ${page === number ? "bg-black text-white" : "border border-black/10 bg-white"}`}>
                {number}
              </Link>
            ))}
            {page < pageCount && <Link href={catalogPageHref(path, query, page + 1)} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black">Next</Link>}
          </nav>
        )}
      </section>
    </div>
  );
}
