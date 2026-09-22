"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FlashSaleProductCard } from "@/components/engagement/flash-sale-product-card";
import { LoyaltyBadge } from "@/components/engagement/loyalty-badge";
import { flashSaleItems } from "@/lib/engagement-data";

function format(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
}

export function FlashSaleEngine() {
  const endRef = useRef<number | null>(null);
  const [left, setLeft] = useState(6 * 60 * 60 * 1000);

  useEffect(() => {
    endRef.current = Date.now() + 6 * 60 * 60 * 1000;
    const timer = window.setInterval(() => {
      if (endRef.current) setLeft(endRef.current - Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const [hours, minutes, seconds] = format(left);

  return (
    <section className="min-h-screen bg-[#f1f1ed] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[36px] bg-black px-6 py-8 text-white sm:px-9">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#d7ff47] px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-black">
                  Live drop
                </span>
                <LoyaltyBadge />
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-[-.07em] sm:text-7xl">
                Flash prices. Limited units.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-white/55">
                Limited-time offers with a live countdown and quantity-aware offer cards.
              </p>
            </div>

            <div className="flex gap-2">
              {[
                [hours, "HRS"],
                [minutes, "MIN"],
                [seconds, "SEC"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="min-w-20 rounded-2xl bg-white/10 p-4 text-center"
                >
                  <p className="text-3xl font-black">{value}</p>
                  <p className="mt-1 text-[9px] font-black tracking-[.18em] text-white/40">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {flashSaleItems.map((sale) => (
            <FlashSaleProductCard key={sale.productId} sale={sale} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/shop"
            className="inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-black"
          >
            View full catalogue
          </Link>
        </div>
      </div>
    </section>
  );
}
