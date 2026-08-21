"use client";
import { FormEvent, useState } from "react";
export function DeliveryChecker({ defaultDelivery }: { defaultDelivery: string }) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState(`Estimated delivery: ${defaultDelivery}`);
  function check(event: FormEvent) { event.preventDefault(); const valid = /^\d{6}$/.test(pin); setMessage(valid ? `Great — delivery is available to ${pin}. Estimated: ${defaultDelivery}.` : "Enter a valid 6-digit PIN code."); }
  return <div className="rounded-[24px] border border-black/10 bg-white p-4"><div className="flex items-center gap-2"><span className="text-lg">⌖</span><div><h3 className="text-sm font-black">Check delivery</h3><p className="text-xs font-bold text-black/40">See availability for your PIN code</p></div></div><form onSubmit={check} className="mt-3 flex gap-2"><input inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="6-digit PIN" className="min-w-0 flex-1 rounded-full border border-black/10 bg-[#f7f7f4] px-4 py-2.5 text-sm font-bold outline-none focus:border-black/30" /><button className="rounded-full bg-black px-4 py-2.5 text-xs font-black text-white">Check</button></form><p className="mt-2 text-xs font-bold text-black/50">{message}</p></div>;
}
