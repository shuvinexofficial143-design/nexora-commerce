import Link from "next/link";
import { Container } from "@/components/ui/container";

const footerGroups = [
  { title:"Shop", links:[["All 16 Murtis","/shop"],["Royal Ganesh","/category/royal"],["Pearl Mini","/category/pearl-mini"],["Lotus Collection","/category/lotus"]] },
  { title:"Help", links:[["Track order","/track-order"],["Ganesh FAQ","/faq"],["Murti guide","/ai-assistant"],["Saved murtis","/wishlist"]] },
  { title:"Collections", links:[["Bal Ganesh","/category/bal-ganesh"],["Decorative","/category/decorative"],["Natural Eco","/category/eco"],["About Prakriti","/about"]] },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-[#1f3a2e] text-white">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="text-3xl font-black tracking-[-0.06em]">PRAKRITI GANESH.</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">A focused 16-murti Ganesh Chaturthi collection with direct Buy Now ordering, Cash on Delivery and secure online payment options.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => <div key={group.title}><p className="text-xs font-black uppercase tracking-[0.16em] text-[#f6c453]">{group.title}</p><div className="mt-4 space-y-3">{group.links.map(([label,href]) => <Link key={href} href={href} className="block text-sm text-white/65 hover:text-white">{label}</Link>)}</div></div>)}
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Prakriti Ganesh.</p><p>COD available · Secure checkout · Order tracking</p>
        </div>
      </Container>
    </footer>
  );
}
