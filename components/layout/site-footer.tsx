import Link from "next/link";
import { Container } from "@/components/ui/container";

const footerGroups = [
  {
    title: "Shop",
    links: ["New arrivals", "Best sellers", "Deals", "Gift cards"],
  },
  {
    title: "Help",
    links: ["Track order", "Returns", "Payments", "Contact support"],
  },
  {
    title: "Company",
    links: ["About Nexora", "Careers", "Sustainability", "Seller program"],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-[#171714] text-white">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="text-3xl font-black tracking-[-0.06em]">NEXORA.</p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
              A smarter storefront built for discovery, trust and a checkout experience that never gets in your way.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#d7ff47]">{group.title}</p>
                <div className="mt-4 space-y-3">
                  {group.links.map((label) => (
                    <Link key={label} href="#" className="block text-sm text-white/65 hover:text-white">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Nexora Commerce. Built for the next generation of shopping.</p>
          <p>Privacy · Terms · Accessibility</p>
        </div>
      </Container>
    </footer>
  );
}
