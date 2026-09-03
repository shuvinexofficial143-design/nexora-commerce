import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { categories } from "@/lib/store-data";

export function CategoryStrip() {
  return (
    <section className="py-4 sm:py-16">
      <Container>
        <div className="sm:hidden">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[17px] font-black tracking-[-0.03em] text-[#1f3a2e]">Choose your Bappa</h2>
            <Link href="/shop" className="text-[11px] font-black text-[#a54f2a]">View all</Link>
          </div>

          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Link key={category.slug} href={`/category/${category.slug}`} className="w-[68px] shrink-0 text-center">
                <div className="relative mx-auto h-[58px] w-[58px] overflow-hidden rounded-full border border-[#1f3a2e]/10 bg-[#fffaf0] shadow-sm">
                  <Image src={category.image} alt={category.name} fill sizes="58px" className="object-cover" />
                </div>
                <p className="mt-1.5 truncate text-[10px] font-bold text-[#1f3a2e]">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden sm:block">
          <SectionHeading
            eyebrow="Find the right murti"
            title="Shop by style & purpose"
            description="From compact home murtis to premium handcrafted pieces and society orders."
          />
          <div className="no-scrollbar mt-7 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link key={category.slug} href={`/category/${category.slug}`} className="group relative aspect-[4/5] min-w-[155px] overflow-hidden rounded-[26px] bg-[#1f3a2e] sm:min-w-0">
                <Image src={category.image} alt={category.name} fill sizes="(max-width: 1024px) 33vw, 16vw" className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-75" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10251d]/85 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#f6c453]">{category.eyebrow}</p>
                  <p className="mt-1 text-lg font-black tracking-[-0.03em]">{category.name}</p>
                  <p className="mt-1 text-[11px] text-white/70">Explore →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
