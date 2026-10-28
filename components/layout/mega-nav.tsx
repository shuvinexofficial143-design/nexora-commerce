import Link from "next/link";

const links = [
  ["New arrivals", "/shop?sort=newest"],
  ["Electronics", "/shop?category=electronics"],
  ["Fashion", "/shop?category=fashion"],
  ["Home", "/shop?category=home"],
  ["Beauty", "/shop?category=beauty"],
  ["Fitness", "/shop?category=fitness"],
  ["Top rated", "/shop?sort=rating"],
] as const;

export function MegaNav() {
  return (
    <nav className="no-scrollbar hidden items-center gap-7 overflow-x-auto border-t border-black/5 py-3 text-[13px] font-bold lg:flex" aria-label="Primary shopping navigation">
      <Link href="/shop" className="rounded-full bg-[#d7ff47] px-4 py-2 text-black">
        Shop all
      </Link>
      {links.map(([label, href]) => (
        <Link key={href} href={href} className="whitespace-nowrap text-black/65 transition hover:text-black">
          {label}
        </Link>
      ))}
      <Link href="/track-order" className="ml-auto whitespace-nowrap font-black text-black/80 hover:underline">
        Track an order
      </Link>
    </nav>
  );
}
