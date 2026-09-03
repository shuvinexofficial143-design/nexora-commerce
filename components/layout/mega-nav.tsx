import Link from "next/link";

const links = [
  ["Royal Ganesh", "/category/royal"],
  ["Pearl Mini", "/category/pearl-mini"],
  ["Lotus Collection", "/category/lotus"],
  ["Bal Ganesh", "/category/bal-ganesh"],
  ["Decorative", "/category/decorative"],
  ["Natural Eco", "/category/eco"],
] as const;

export function MegaNav() {
  return (
    <nav className="no-scrollbar hidden items-center gap-7 overflow-x-auto border-t border-[#1f3a2e]/5 py-3 text-[13px] font-bold lg:flex" aria-label="Primary shopping navigation">
      <Link href="/shop" className="rounded-full bg-[#dce8cf] px-4 py-2 text-[#1f3a2e]">Shop all 16 murtis</Link>
      {links.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap text-[#1f3a2e]/65 transition hover:text-[#1f3a2e]">{label}</Link>)}
      <Link href="/shop" className="ml-auto whitespace-nowrap font-black text-[#a54f2a]">Ganesh Chaturthi Offer</Link>
    </nav>
  );
}
