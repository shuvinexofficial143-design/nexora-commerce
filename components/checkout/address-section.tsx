"use client";

import { useState } from "react";
import { AddressCard } from "@/components/checkout/address-card";
import { AddressForm } from "@/components/checkout/address-form";
import type { CheckoutAddress } from "@/types/checkout";

export function AddressSection({ addresses, selectedId, onSelect, onAdd }: { addresses: CheckoutAddress[]; selectedId: string; onSelect: (id: string) => void; onAdd: (address: CheckoutAddress) => void }) {
  const [adding, setAdding] = useState(false);
  return (
    <section className="rounded-[30px] border border-black/10 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-black/35">01 · Address</p><h2 className="mt-1 text-xl font-black">Where should we deliver?</h2></div><button type="button" onClick={() => setAdding((value) => !value)} className="rounded-full border border-black/10 px-4 py-2 text-xs font-black hover:bg-black hover:text-white">{adding ? "Cancel" : "+ New address"}</button></div>
      {adding && <AddressForm onSave={(address) => { onAdd(address); setAdding(false); }} />}
      <div className="mt-5 grid gap-3 md:grid-cols-2">{addresses.map((address) => <AddressCard key={address.id} address={address} selected={address.id === selectedId} onSelect={() => onSelect(address.id)} />)}</div>
    </section>
  );
}
