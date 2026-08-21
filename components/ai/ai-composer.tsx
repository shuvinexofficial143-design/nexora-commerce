"use client";
import type { FormEvent } from "react";
import { useState } from "react";

export function AiComposer({ onSend, busy }: { onSend: (message: string) => void; busy: boolean }) {
  const [value, setValue] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = value.trim();
    if (!message || busy) return;
    onSend(message);
    setValue("");
  }
  return (
    <form onSubmit={submit} className="flex items-end gap-2 rounded-[26px] border border-black/10 bg-white p-2 shadow-[0_18px_60px_rgba(17,17,15,.08)]">
      <textarea value={value} onChange={(event) => setValue(event.target.value)} rows={1} placeholder="Try: ₹5000 ke andar best wireless headphones..." className="min-h-12 max-h-32 flex-1 resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-black/35" />
      <button type="submit" disabled={busy || !value.trim()} className="h-12 shrink-0 rounded-full bg-[#d7ff47] px-5 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Thinking..." : "Ask AI ↗"}</button>
    </form>
  );
}
