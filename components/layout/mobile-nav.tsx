import Link from "next/link";

const mobileLinks = [
  ["Shop all", "/shop"],
  ["New & trending", "/shop?sort=newest"],
  ["Electronics", "/shop?category=electronics"],
  ["Fashion", "/shop?category=fashion"],
  ["Home & living", "/shop?category=home"],
  ["Beauty", "/shop?category=beauty"],
  ["Deals", "/shop?sort=discount"],
] as const;

export function MobileNav() {
  return (
    <details className="group relative lg:hidden">
      <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-black/10 bg-white text-xl font-black transition hover:bg-black hover:text-white">
        <span className="group-open:hidden">≡</span>
        <span className="hidden group-open:inline">×</span>
        <span className="sr-only">Toggle menu</span>
      </summary>
      <div className="absolute left-0 top-12 w-[min(86vw,320px)] rounded-3xl border border-black/10 bg-white p-3 shadow-2xl">
        <p className="px-3 pb-2 pt-1 text-[11px] font-black uppercase tracking-[0.18em] text-black/40">
          Browse Nexora
        </p>
        {mobileLinks.map(([label, href]) => (
          <Link key={href} href={href} className="block rounded-2xl px-3 py-3 text-sm font-bold hover:bg-black/5">
            {label}
          </Link>
        ))}
      </div>
    </details>
  );
}
