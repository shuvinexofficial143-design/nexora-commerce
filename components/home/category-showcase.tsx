import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { categories } from "@/lib/store-data";

export function CategoryShowcase() {
  return (
    <section className="py-14 sm:py-18">
      <Container>
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Browse by mood</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Six ways into the store</h2>
          </div>
          <Link href="/categories" className="hidden text-sm font-black underline decoration-2 underline-offset-4 sm:block">All categories →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="group relative min-h-56 overflow-hidden rounded-[26px] sm:min-h-72">
              <Image src={category.image} alt={category.name} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">{category.eyebrow}</p>
                <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">{category.name}</h3>
                <p className="mt-2 hidden max-w-sm text-xs leading-5 text-white/65 sm:block">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
