import Link from "next/link";
import { Container } from "@/components/ui/container";
import { MegaNav } from "./mega-nav";
import { MobileNav } from "./mobile-nav";
import { SearchBar } from "@/components/search/search-bar";
import { CartIconLink } from "@/components/cart/cart-icon-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1f3a2e]/10 bg-[#fffaf0]/95 backdrop-blur-xl">
      <div className="bg-[#1f3a2e] text-white">
        <Container className="flex h-7 items-center justify-between text-[9px] font-semibold tracking-wide sm:h-8 sm:text-[10px]">
          <p>Eco-friendly delivery across India</p>
          <p className="hidden text-white/65 sm:block">Natural clay · Handmade · Water-friendly visarjan</p>
          <Link href="/shop" className="text-[#f6c453] hover:underline">Ganesh Chaturthi 2026 ✦</Link>
        </Container>
      </div>

      <Container>
        <div className="flex h-14 items-center gap-2 sm:h-16 sm:gap-3 lg:h-[70px] lg:gap-6">
          <MobileNav />
          <Link href="/" className="shrink-0" aria-label="Prakriti Ganesh home">
            <span className="text-lg font-black tracking-[-0.055em] text-[#1f3a2e] sm:text-xl lg:text-2xl">PRAKRITI.</span>
            <span className="ml-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#a54f2a] sm:text-[10px]">Ganesh</span>
          </Link>

          <div className="hidden min-w-0 flex-1 md:block"><SearchBar /></div>

          <nav className="ml-auto flex shrink-0 items-center gap-0.5" aria-label="Account links">
            <Link href="/shop" className="hidden rounded-full bg-[#dce8cf] px-3 py-2 text-xs font-black text-[#1f3a2e] lg:block">Shop Murtis</Link>
            <Link href="/account" className="rounded-full px-2.5 py-2 text-xs font-bold hover:bg-[#1f3a2e]/5 sm:px-3 sm:text-sm">
              <span className="hidden sm:inline">Account</span><span className="sm:hidden">You</span>
            </Link>
            <Link href="/wishlist" className="hidden rounded-full px-3 py-2 text-sm font-bold hover:bg-[#1f3a2e]/5 sm:block">Wishlist</Link>
            <CartIconLink />
          </nav>
        </div>

        <div className="pb-2.5 md:hidden"><SearchBar /></div>
        <MegaNav />
      </Container>
    </header>
  );
}
