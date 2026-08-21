import Link from "next/link";
import type { Brand } from "@/types/home";

export function BrandLogo({ brand }: { brand: Brand }) {
  return (
    <Link
      href={brand.href}
      className="group flex min-h-28 flex-col items-center justify-center rounded-[24px] border border-black/8 bg-white px-5 text-center transition hover:-translate-y-1 hover:border-black/16 hover:shadow-[0_18px_45px_rgba(17,17,15,0.08)]"
    >
      <span className="text-xl font-black tracking-[-0.05em] sm:text-2xl">{brand.name}</span>
      <span className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-black/35">{brand.label}</span>
      <span className="mt-3 text-xs font-black opacity-0 transition group-hover:opacity-100">Explore →</span>
    </Link>
  );
}
