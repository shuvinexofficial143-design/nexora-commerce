"use client";

import { useState } from "react";
import { AddressCard } from "@/components/checkout/address-card";
import { AddressForm } from "@/components/checkout/address-form";
import type { CheckoutAddress } from "@/types/checkout";

export function AddressSection({ addresses, selectedId, onSelect, onAdd }: { addresses: CheckoutAddress[]; selectedId: string; onSelect: (id: string) => void; onAdd: (address: CheckoutAddress) => void }) {
  const [adding, setAdding] = useState(addresses.length === 0);
  return (
    <section className="rounded-[30px] border border-black/10 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-black/35">01 · Delivery Address</p><h2 className="mt-1 text-xl font-black">Enter your delivery details</h2></div>
        {addresses.length ? <button type="button" onClick={() => setAdding((value) => !value)} className="rounded-full border border-black/10 px-4 py-2 text-xs font-black hover:bg-black hover:text-white">{adding ? "Cancel" : "+ New address"}</button> : null}
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-black/45">Name, mobile, house/building, area/colony, city, PIN code and state are collected separately for accurate delivery.</p>
      {adding && <AddressForm onSave={(address) => { onAdd(address); setAdding(false); }} />}
      {addresses.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{addresses.map((address) => <AddressCard key={address.id} address={address} selected={address.id === selectedId} onSelect={() => onSelect(address.id)} />)}</div> : null}
    </section>
  );
}
