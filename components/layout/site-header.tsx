import Link from "next/link";
import { Container } from "@/components/ui/container";
import { MegaNav } from "./mega-nav";
import { MobileNav } from "./mobile-nav";
import { SearchBar } from "@/components/search/search-bar";
import { CartIconLink } from "@/components/cart/cart-icon-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f8f8f6]/95 backdrop-blur-xl">
      <div className="bg-[#171714] text-white">
        <Container className="flex h-6 items-center justify-between text-[9px] font-semibold tracking-wide sm:h-7 sm:text-[10px]">
          <p>Free delivery over ₹999</p>
          <p className="hidden text-white/60 sm:block">Secure checkout · Easy returns</p>
          <Link href="/ai-assistant" className="text-[#d7ff47] hover:underline">Ask AI ✦</Link>
        </Container>
      </div>

      <Container>
        <div className="flex h-14 items-center gap-2 sm:h-16 sm:gap-3 lg:h-[68px] lg:gap-6">
          <MobileNav />
          <Link href="/" className="shrink-0" aria-label="Nexora Commerce home">
            <span className="text-lg font-black tracking-[-0.06em] sm:text-xl lg:text-2xl">NEXORA.</span>
          </Link>

          <div className="hidden min-w-0 flex-1 md:block"><SearchBar /></div>

          <nav className="ml-auto flex shrink-0 items-center gap-0.5" aria-label="Account links">
            <Link href="/ai-assistant" className="hidden rounded-full bg-[#d7ff47] px-3 py-2 text-xs font-black lg:block">AI Shop ✦</Link>
            <Link href="/wishlist" className="hidden rounded-full px-3 py-2 text-sm font-bold hover:bg-black/5 sm:block">Wishlist</Link>
            <CartIconLink />
          </nav>
        </div>

        <div className="pb-2.5 md:hidden"><SearchBar /></div>
        <MegaNav />
      </Container>
    </header>
  );
}
