"use client";

import { useState } from "react";

export function PasswordField({ value, onChange, label = "Password", autoComplete }: { value: string; onChange: (value: string) => void; label?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="block text-sm font-bold">{label}<span className="relative mt-2 block"><input value={value} onChange={(e) => onChange(e.target.value)} type={visible ? "text" : "password"} autoComplete={autoComplete} className="h-12 w-full rounded-2xl border border-black/15 bg-[#f8f8f6] px-4 pr-20 outline-none transition focus:border-black" /><button type="button" onClick={() => setVisible((current) => !current)} className="absolute inset-y-0 right-3 text-xs font-black text-black/55">{visible ? "Hide" : "Show"}</button></span></label>;
}
