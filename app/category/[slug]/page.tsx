import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogShell } from "@/components/catalog/catalog-shell";
import { Container } from "@/components/ui/container";
import { catalogProducts } from "@/lib/catalog-data";

const categoryNames: Record<string, string> = {
  "shadu-mati": "Shadu Mati Ganesh",
  "seed-ganesh": "Seed Ganesh",
  "home-murtis": "Home Murtis",
  premium: "Premium Ganesh",
  "natural-finish": "Natural Finish Ganesh",
  "bulk-orders": "Society & Bulk Orders",
};

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(categoryNames).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = categoryNames[slug];
  return name
    ? { title: name, description: `Shop ${name} from Prakriti Ganesh.` }
    : { title: "Ganesh collection" };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const products = catalogProducts.filter((product) => product.category === slug);
  const name = categoryNames[slug];
  if (!name || products.length === 0) notFound();

  return (
    <main className="pb-24">
      <Container>
        <div className="py-5 text-xs font-bold text-[#1f3a2e]/50">
          <Link href="/">Home</Link> <span className="px-2">/</span> <Link href="/shop">Shop</Link> <span className="px-2">/</span> <span className="text-[#1f3a2e]">{name}</span>
        </div>
        <section className="mb-7 rounded-[30px] bg-[#f4ead7] px-5 py-8 sm:rounded-[38px] sm:px-10 sm:py-11">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a54f2a]">Prakriti Ganesh collection</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-[#1f3a2e] sm:text-5xl">{name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#1f3a2e]/60">Browse {products.length} handcrafted options and compare size, finish, price and availability.</p>
        </section>
        <CatalogShell products={products} />
      </Container>
    </main>
  );
}
