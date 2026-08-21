"use client";

import { useState } from "react";
import type { CheckoutAddress } from "@/types/checkout";

const empty = { fullName: "", phone: "", line1: "", city: "", state: "", postalCode: "" };
export function AddressForm({ onSave }: { onSave: (address: CheckoutAddress) => void }) {
  const [form, setForm] = useState(empty);
  const update = (key: keyof typeof empty, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = () => { if (Object.values(form).some((value) => !value.trim())) return; onSave({ id: `addr-${Date.now()}`, label: "New", country: "India", ...form }); setForm(empty); };
  return (
    <div className="mt-5 rounded-[24px] bg-[#f4f4f0] p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {([['fullName','Full name'],['phone','Phone'],['line1','House / street'],['city','City'],['state','State'],['postalCode','PIN code']] as const).map(([key,label]) => <label key={key} className="text-xs font-black text-black/55">{label}<input value={form[key]} onChange={(e) => update(key,e.target.value)} className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-black/30" /></label>)}
      </div>
      <button type="button" onClick={save} className="mt-4 rounded-full bg-black px-5 py-3 text-xs font-black text-white">Save & use address</button>
    </div>
  );
}
