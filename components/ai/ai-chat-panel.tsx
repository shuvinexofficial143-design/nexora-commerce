"use client";
import { useState } from "react";
import type { AiAssistantResponse, AiMessage, AiShoppingIntent } from "@/types/ai";
import { AiComposer } from "@/components/ai/ai-composer";
import { AiMessage as MessageBubble } from "@/components/ai/ai-message";
import { AiQuickPrompts } from "@/components/ai/ai-quick-prompts";
import { AiSearchIntent } from "@/components/ai/ai-search-intent";

const emptyIntent: AiShoppingIntent = { brands: [], features: [], sortBy: "relevance" };

export function AiChatPanel() {
  const [busy, setBusy] = useState(false);
  const [intent, setIntent] = useState<AiShoppingIntent>(emptyIntent);
  const [mode, setMode] = useState<"demo" | "groq">("demo");
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Namaste! Ghar, gifting ya society ke liye murti chahiye? Budget, size aur material batao — main Prakriti Ganesh collection se suitable options shortlist kar dunga.",
      createdAt: new Date().toISOString(),
    },
  ]);

  async function send(message: string) {
    const userMessage: AiMessage = { id: `u-${Date.now()}`, role: "user", content: message, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, userMessage]);
    setBusy(true);
    try {
      const response = await fetch("/api/ai-shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("AI request failed");
      const data = (await response.json()) as AiAssistantResponse;
      setIntent(data.intent);
      setMode(data.mode);
      setMessages((current) => [
        ...current,
        { id: `a-${Date.now()}`, role: "assistant", content: data.answer, products: data.products, createdAt: new Date().toISOString() },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: `e-${Date.now()}`, role: "assistant", content: "Assistant abhi respond nahi kar pa raha. Ek baar dobara try karo.", createdAt: new Date().toISOString() },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
      <section className="overflow-hidden rounded-[32px] border border-black/10 bg-[#fffdf8] shadow-[0_30px_100px_rgba(17,17,15,.08)]">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-black/40">Murti selection guide</p>
            <h2 className="text-xl font-black">Ask naturally. Choose mindfully.</h2>
          </div>
          <span className="rounded-full bg-[#f4d7a1] px-3 py-2 text-[10px] font-black uppercase text-[#1f3a2e]">{mode === "groq" ? "Live AI" : "Smart Demo"}</span>
        </div>
        <div className="space-y-5 p-5 sm:p-7">
          {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
          {busy && <div className="w-fit rounded-full bg-black/5 px-4 py-2 text-xs font-black text-black/45">Checking murti collection…</div>}
        </div>
        <div className="border-t border-black/10 bg-white/70 p-4 sm:p-5">
          <AiQuickPrompts onPick={send} />
          <div className="mt-3"><AiComposer onSend={send} busy={busy} /></div>
        </div>
      </section>
      <aside className="space-y-4">
        <AiSearchIntent intent={intent} />
        <div className="rounded-[28px] bg-[#1f3a2e] p-6 text-white">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#f4d7a1]">Guide can help with</p>
          <ul className="mt-4 space-y-3 text-sm font-bold text-white/75">
            <li>✓ Budget-aware murti recommendations</li>
            <li>✓ Home vs society size guidance</li>
            <li>✓ Shadu, seed & natural-finish discovery</li>
            <li>✓ Stock and delivery-aware shortlist</li>
            <li>✓ Product comparison guidance</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
