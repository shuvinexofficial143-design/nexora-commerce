import Link from "next/link";
import { Container } from "@/components/ui/container";
import { trendingSearches } from "@/lib/home-data";

export function TrendingSearches() {
  return (
    <section className="py-8 sm:py-10">
      <Container>
        <div className="flex flex-col gap-5 rounded-[28px] border border-black/8 bg-white p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="shrink-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/35">Trending now</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.04em]">What people are searching</h2>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto sm:justify-end">
            {trendingSearches.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-full bg-[#f3f3ef] px-4 py-2 text-xs font-black transition hover:bg-[#d7ff47]">
                {item.label} ↗
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
