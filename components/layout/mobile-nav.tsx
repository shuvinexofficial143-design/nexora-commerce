import Link from "next/link";

const mobileLinks = [
  ["Shop all murtis", "/shop"],
  ["New 2026 Collection", "/new"],
  ["Shadu Mati", "/category/shadu-mati"],
  ["Seed Ganesh", "/category/seed-ganesh"],
  ["Home Murtis", "/category/home-murtis"],
  ["Premium Murtis", "/category/premium"],
  ["Bulk orders", "/category/bulk-orders"],
] as const;

export function MobileNav() {
  return (
    <details className="group relative lg:hidden">
      <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-[#1f3a2e]/10 bg-white text-xl font-black text-[#1f3a2e] transition hover:bg-[#1f3a2e] hover:text-white">
        <span className="group-open:hidden">≡</span>
        <span className="hidden group-open:inline">×</span>
        <span className="sr-only">Toggle menu</span>
      </summary>
      <div className="absolute left-0 top-12 w-[min(86vw,320px)] rounded-3xl border border-[#1f3a2e]/10 bg-[#fffdf8] p-3 shadow-2xl">
        <p className="px-3 pb-2 pt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#a54f2a]">
          Browse Prakriti Ganesh
        </p>
        {mobileLinks.map(([label, href]) => (
          <Link key={href} href={href} className="block rounded-2xl px-3 py-3 text-sm font-bold text-[#1f3a2e] hover:bg-[#dce8cf]/60">
            {label}
          </Link>
        ))}
      </div>
    </details>
  );
}
