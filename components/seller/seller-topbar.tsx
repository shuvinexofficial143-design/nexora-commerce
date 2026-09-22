"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  "/seller": "Seller dashboard",
  "/seller/products": "Products",
  "/seller/orders": "Orders",
  "/seller/inventory": "Inventory",
  "/seller/earnings": "Earnings",
  "/seller/payouts": "Payouts",
  "/seller/reviews": "Reviews",
  "/seller/analytics": "Analytics",
  "/seller/profile": "Seller profile",
  "/seller/onboarding": "Seller onboarding",
};

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "NX";
}

export function SellerTopbar({
  storeName,
}: {
  storeName: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f5f5f1]/90 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-black/40">
            {storeName}
          </p>
          <h1 className="text-lg font-black">
            {labels[pathname] ?? "Seller workspace"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/seller/products"
            className="hidden rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black sm:inline-flex"
          >
            + Add product
          </Link>
          <Link
            href="/seller/profile"
            className="grid h-10 w-10 place-items-center rounded-full bg-black text-xs font-black text-white"
            aria-label="Seller profile"
          >
            {initials(storeName)}
          </Link>
        </div>
      </div>
    </header>
  );
}
