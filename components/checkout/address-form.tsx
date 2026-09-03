"use client";

import { useState } from "react";
import type { CheckoutAddress } from "@/types/checkout";

const states = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh"];

const empty = { fullName:"", phone:"", alternatePhone:"", line1:"", areaColony:"", landmark:"", city:"", state:"Madhya Pradesh", postalCode:"" };

type FormKey = keyof typeof empty;

export function AddressForm({ onSave }: { onSave: (address: CheckoutAddress) => void }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const update = (key: FormKey, value: string) => { setError(""); setForm((current) => ({ ...current, [key]: value })); };

  const save = () => {
    const phone = form.phone.replace(/\D/g, "");
    const alternate = form.alternatePhone.replace(/\D/g, "");
    if (!form.fullName.trim()) return setError("Please enter your full name.");
    if (!/^[6-9]\d{9}$/.test(phone)) return setError("Enter a valid 10-digit Indian mobile number.");
    if (alternate && !/^[6-9]\d{9}$/.test(alternate)) return setError("Alternate mobile number is not valid.");
    if (!form.line1.trim()) return setError("Please enter house / flat / building details.");
    if (!form.areaColony.trim()) return setError("Please enter area / colony.");
    if (!form.city.trim()) return setError("Please enter city.");
    if (!/^\d{6}$/.test(form.postalCode)) return setError("PIN code must be exactly 6 digits.");
    if (!form.state.trim()) return setError("Please select a state.");

    onSave({
      id: `addr-${Date.now()}`,
      label: "Delivery address",
      country: "India",
      ...form,
      phone,
      alternatePhone: alternate || undefined,
      landmark: form.landmark.trim() || undefined,
    });
    setForm(empty);
  };

  const inputClass = "mt-1.5 h-12 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-bold outline-none focus:border-[#1f3a2e]";
  return (
    <div className="mt-5 rounded-[24px] bg-[#f4f0e7] p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-black text-black/60">Full Name<input autoComplete="name" value={form.fullName} onChange={(e)=>update("fullName",e.target.value)} className={inputClass} placeholder="Your full name" /></label>
        <label className="text-xs font-black text-black/60">Mobile Number<input inputMode="numeric" autoComplete="tel" maxLength={10} value={form.phone} onChange={(e)=>update("phone",e.target.value.replace(/\D/g,""))} className={inputClass} placeholder="10-digit mobile number" /></label>
        <label className="text-xs font-black text-black/60">House / Flat / Building<input autoComplete="address-line1" value={form.line1} onChange={(e)=>update("line1",e.target.value)} className={inputClass} placeholder="House no., flat or building" /></label>
        <label className="text-xs font-black text-black/60">Area / Colony<input value={form.areaColony} onChange={(e)=>update("areaColony",e.target.value)} className={inputClass} placeholder="Area, colony or locality" /></label>
        <label className="text-xs font-black text-black/60">Landmark <span className="font-semibold text-black/35">(optional)</span><input value={form.landmark} onChange={(e)=>update("landmark",e.target.value)} className={inputClass} placeholder="Nearby landmark" /></label>
        <label className="text-xs font-black text-black/60">City<input autoComplete="address-level2" value={form.city} onChange={(e)=>update("city",e.target.value)} className={inputClass} placeholder="City" /></label>
        <label className="text-xs font-black text-black/60">PIN Code<input inputMode="numeric" autoComplete="postal-code" maxLength={6} value={form.postalCode} onChange={(e)=>update("postalCode",e.target.value.replace(/\D/g,""))} className={inputClass} placeholder="6-digit PIN code" /></label>
        <label className="text-xs font-black text-black/60">State<select autoComplete="address-level1" value={form.state} onChange={(e)=>update("state",e.target.value)} className={inputClass}>{states.map((state)=><option key={state} value={state}>{state}</option>)}</select></label>
        <label className="text-xs font-black text-black/60 sm:col-span-2">Alternate Mobile Number <span className="font-semibold text-black/35">(optional)</span><input inputMode="numeric" maxLength={10} value={form.alternatePhone} onChange={(e)=>update("alternatePhone",e.target.value.replace(/\D/g,""))} className={inputClass} placeholder="Alternate 10-digit number" /></label>
      </div>
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p> : null}
      <button type="button" onClick={save} className="mt-4 min-h-12 rounded-full bg-[#1f3a2e] px-6 text-sm font-black text-white">Save & Use Address</button>
    </div>
  );
}
