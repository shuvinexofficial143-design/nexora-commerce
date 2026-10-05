"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LastOrder = {
  orderId?: string;
  email?: string;
  deliveryLabel?: string;
  paymentId?: string;
  itemCount?: number;
};

export function OrderSuccess() {
  const [details, setDetails] = useState<LastOrder>({});
  const [queryOrder, setQueryOrder] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = sessionStorage.getItem("nexora-last-order");
        if (raw) setDetails(JSON.parse(raw));
        setQueryOrder(new URLSearchParams(window.location.search).get("order") || "");
      } catch {}
    });
    return () => {
      active = false;
    };
  }, []);

  const orderId = queryOrder || details.orderId || "NEXORA-ORDER";

  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#d7ff47] text-4xl">✓</div>

      <p className="mt-7 text-xs font-black uppercase tracking-[.2em] text-black/35">
        Order confirmed
      </p>

      <h1 className="mt-2 text-4xl font-black tracking-[-.06em] sm:text-6xl">
        Thanks. It&apos;s on the way.
      </h1>

      <p className="mx-auto mt-4 max-w-xl text-sm font-bold leading-6 text-black/45">
        Order <span className="text-black">{orderId}</span> has been confirmed successfully.
        {details.email ? ` Order updates will be sent to ${details.email}.` : " Keep this order number for support."}
      </p>

      <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
        <Stat label="Items" value={String(details.itemCount ?? "—")} />
        <Stat label="Delivery" value={details.deliveryLabel ?? "Selected"} />
        <Stat label="Payment" value={(details.paymentId ?? "Selected").toUpperCase()} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/shop"
          className="rounded-full border border-black/10 bg-[#CDEBFF] px-6 py-3.5 text-sm font-black text-black transition hover:bg-[#B8E1FA]"
        >
          Keep shopping
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-black/10 bg-[#FFD8C7] px-6 py-3.5 text-sm font-black text-black transition hover:bg-[#FFC8B4]"
        >
          Order support
        </Link>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[.15em] text-black/35">{label}</p>
      <p className="mt-2 text-sm font-black">{value}</p>
    </div>
  );
}
