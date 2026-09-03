import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { catalogProducts } from "@/lib/catalog-data";

export const metadata: Metadata = {
  title: "Search Ganesh Murtis | Prakriti Ganesh",
  description: "Search eco-friendly Ganesh murtis by size, material, finish, budget and use case.",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

function matches(product: (typeof catalogProducts)[number], query: string) {
  const haystack = [
    product.name,
    product.brand,
    product.category,
    ...product.tags,
    ...product.colors,
  ].join(" ").toLowerCase();
  return query.split(/\s+/).filter(Boolean).every((term) => haystack.includes(term));
}

const popular = [
  ["Shadu Mati", "shadu"],
  ["Seed Ganesh", "seed"],
  ["Small home murti", "home"],
  ["Premium 18 inch", "18-inch"],
  ["Society Ganesh", "society"],
] as const;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const results = query ? catalogProducts.filter((product) => matches(product, query)) : [];

  return (
    <main className="pb-20">
      <Container className="py-8 sm:py-12">
        <div className="rounded-[30px] bg-[#f4ead7] p-6 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#a54f2a]">Prakriti Ganesh search</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.055em] text-[#1f3a2e] sm:text-5xl">
            {query ? `Results for “${q.trim()}”` : "Search the murti collection"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-black/50">
            Search by Shadu Mati, Seed Ganesh, size, natural finish, gifting, home use or society requirements.
          </p>
          <form action="/search" className="mt-6 flex max-w-2xl gap-2">
            <input name="q" defaultValue={q} placeholder="Try: 12 inch shadu" className="h-12 min-w-0 flex-1 rounded-full border border-black/10 bg-white px-5 text-sm font-bold outline-none focus:border-[#1f3a2e]" />
            <button className="rounded-full bg-[#1f3a2e] px-6 text-sm font-black text-white">Search</button>
          </form>
        </div>

        {!query ? (
          <section className="mt-8">
            <h2 className="text-xl font-black">Popular searches</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {popular.map(([label, value]) => <Link key={value} href={`/search?q=${encodeURIComponent(value)}`} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black hover:border-black/30">{label}</Link>)}
            </div>
          </section>
        ) : results.length ? (
          <section className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div><p className="text-xs font-black uppercase tracking-[.16em] text-black/35">Matching collection</p><h2 className="mt-1 text-2xl font-black">{results.length} murti{results.length === 1 ? "" : "s"} found</h2></div>
              <Link href="/shop" className="text-sm font-black">View all →</Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {results.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-[30px] border border-dashed border-black/15 bg-white p-10 text-center">
            <div className="text-4xl">🌿</div>
            <h2 className="mt-4 text-2xl font-black">No exact murti found</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-bold leading-6 text-black/45">Try a broader term like “shadu”, “seed”, “home”, “premium”, “natural” or “society”.</p>
            <Link href="/shop" className="mt-5 inline-flex rounded-full bg-[#1f3a2e] px-5 py-3 text-sm font-black text-white">Browse all murtis</Link>
          </section>
        )}
      </Container>
    </main>
  );
}
