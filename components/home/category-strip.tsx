import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { categories } from "@/lib/store-data";

export function CategoryStrip() {
  return (
    <section className="py-3 sm:py-14">
      <Container>
        <div className="sm:hidden">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[17px] font-black tracking-[-0.03em]">Categories</h2>
            <Link href="/shop" className="text-[11px] font-black text-black/55">View all</Link>
          </div>

          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="w-[64px] shrink-0 text-center"
              >
                <div className="relative mx-auto h-[54px] w-[54px] overflow-hidden rounded-full border border-black/8 bg-white shadow-sm">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="54px"
                    className="object-cover"
                  />
                </div>
                <p className="mt-1.5 truncate text-[10px] font-bold">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden sm:block">
          <SectionHeading
            eyebrow="Find your lane"
            title="Shop by category"
            description="Fast entry points for the collections customers reach for most."
          />
          <div className="no-scrollbar mt-7 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group relative aspect-[4/5] min-w-[155px] overflow-hidden rounded-[24px] bg-black sm:min-w-0"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 1024px) 33vw, 16vw"
                  className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">{category.eyebrow}</p>
                  <p className="mt-1 text-lg font-black tracking-[-0.03em]">{category.name}</p>
                  <p className="mt-1 text-[11px] text-white/65">Explore →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
