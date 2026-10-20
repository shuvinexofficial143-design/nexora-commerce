import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CatalogShell } from "@/components/catalog/catalog-shell";
import { getCatalogProducts } from "@/lib/catalog-backend";

export const metadata: Metadata = {
  title: "Search Products | NEXORA",
  description: "Search Nexora products by name, category, brand and features.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = String((await searchParams).q ?? "").trim().slice(0, 120);
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const products = tokens.length ? await getCatalogProducts() : [];
  const matches = products.filter((product) => {
    const haystack = [
      product.name,
      product.brand,
      product.category,
      ...product.tags,
    ].join(" ").toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });

  return (
    <main className="pb-24 pt-8">
      <Container>
        <h1 className="text-3xl font-black tracking-[-.05em] sm:text-5xl">Search Nexora</h1>
        <form action="/search" role="search" className="mt-6 flex max-w-2xl gap-2">
          <input
            name="q"
            type="search"
            required
            maxLength={120}
            defaultValue={query}
            placeholder="Products, categories or brands"
            className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-5 py-3 outline-none focus:border-black"
          />
          <button className="rounded-full bg-black px-6 py-3 text-sm font-black text-white">Search</button>
        </form>
        {query ? (
          <>
            <p className="mt-6 text-sm font-bold text-black/50">
              {matches.length} results for &quot;{query}&quot;
            </p>
            {matches.length ? (
              <div className="mt-6"><CatalogShell products={matches} /></div>
            ) : (
              <div className="mt-6 rounded-3xl bg-white p-8">
                <p className="font-black">No matching products found.</p>
                <p className="mt-2 text-sm text-black/50">Try a simpler keyword or browse all products.</p>
                <Link href="/shop" className="mt-4 inline-block rounded-full bg-[#d7ff47] px-5 py-3 text-sm font-black">Browse shop</Link>
              </div>
            )}
          </>
        ) : (
          <p className="mt-6 text-sm text-black/50">Enter a product name, brand, or category to search.</p>
        )}
      </Container>
    </main>
  );
}
