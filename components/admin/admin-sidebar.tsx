"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  ["Overview", "/admin", "⌂"],
  ["Products", "/admin/products", "◇"],
  ["Orders", "/admin/orders", "▣"],
  ["Inventory", "/admin/inventory", "▤"],
  ["Coupons", "/admin/coupons", "%"],
  ["Returns", "/admin/returns", "↩"],
  ["Notifications", "/admin/notifications", "●"],
  ["Settings", "/admin/settings", "⚙"],
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-black/10 bg-[#11110f] text-white lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-5 lg:block">
        <Link href="/admin" className="text-xl font-black">
          NEXORA <span className="text-[#d7ff47]">OWNER</span>
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/15 px-3 py-2 text-xs font-black text-white/70 lg:mt-4 lg:inline-flex"
        >
          View store ↗
        </Link>
      </div>

      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1">
        {nav.map(([label, href, icon]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black ${
                active ? "bg-[#d7ff47] text-black" : "text-white/65 hover:bg-white/10"
              }`}
            >
              <span className="w-5 text-center">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden px-5 py-6 text-xs leading-5 text-white/35 lg:block">
        Private single-owner panel
      </div>
    </aside>
  );
}
