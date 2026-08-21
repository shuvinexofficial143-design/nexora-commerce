import Link from "next/link";
import { Container } from "@/components/ui/container";
import { MegaNav } from "./mega-nav";
import { MobileNav } from "./mobile-nav";
import { SearchBar } from "@/components/search/search-bar";
import { CartIconLink } from "@/components/cart/cart-icon-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f8f8f6]/90 backdrop-blur-xl">
      <div className="bg-[#171714] text-white"><Container className="flex h-8 items-center justify-between text-[11px] font-semibold tracking-wide"><p>Free delivery over ₹999</p><p className="hidden text-white/65 sm:block">Secure checkout · Easy returns · Human support</p><Link href="/ai-assistant" className="text-[#d7ff47] hover:underline">Ask NEXORA AI ✦</Link></Container></div>
      <Container><div className="flex h-[72px] items-center gap-4 lg:gap-7"><MobileNav /><Link href="/" className="shrink-0" aria-label="Nexora Commerce home"><span className="text-xl font-black tracking-[-0.06em] sm:text-2xl">NEXORA.</span></Link><div className="hidden min-w-0 flex-1 md:block"><SearchBar /></div><nav className="ml-auto flex shrink-0 items-center gap-1" aria-label="Account links"><Link href="/ai-assistant" className="hidden rounded-full bg-[#d7ff47] px-3 py-2 text-xs font-black lg:block">AI Shop ✦</Link><Link href="/account" className="rounded-full px-3 py-2 text-sm font-bold hover:bg-black/5"><span className="hidden sm:inline">Account</span><span className="sm:hidden">You</span></Link><Link href="/wishlist" className="hidden rounded-full px-3 py-2 text-sm font-bold hover:bg-black/5 sm:block">Wishlist</Link><CartIconLink /></nav></div><div className="pb-3 md:hidden"><SearchBar /></div><MegaNav /></Container>
    </header>
  );
}
