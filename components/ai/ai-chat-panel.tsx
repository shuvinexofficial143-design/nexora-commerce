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
  const [messages, setMessages] = useState<AiMessage[]>([{ id: "welcome", role: "assistant", content: "Hi! Budget, category ya use-case batao. Main NEXORA catalog se best products shortlist, compare aur explain kar dunga.", createdAt: new Date().toISOString() }]);

  async function send(message: string) {
    const userMessage: AiMessage = { id: `u-${Date.now()}`, role: "user", content: message, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, userMessage]);
    setBusy(true);
    try {
      const response = await fetch("/api/ai-shopping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      if (!response.ok) throw new Error("AI request failed");
      const data = (await response.json()) as AiAssistantResponse;
      setIntent(data.intent);
      setMode(data.mode);
      setMessages((current) => [...current, { id: `a-${Date.now()}`, role: "assistant", content: data.answer, products: data.products, createdAt: new Date().toISOString() }]);
    } catch {
      setMessages((current) => [...current, { id: `e-${Date.now()}`, role: "assistant", content: "AI service abhi respond nahi kar pa rahi. Ek baar dobara try karo.", createdAt: new Date().toISOString() }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
      <section className="overflow-hidden rounded-[32px] border border-black/10 bg-[#fbfbf8] shadow-[0_30px_100px_rgba(17,17,15,.08)]">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 sm:px-7"><div><p className="text-xs font-black uppercase tracking-[.16em] text-black/40">Shopping copilot</p><h2 className="text-xl font-black">Ask naturally. Shop smarter.</h2></div><span className="rounded-full bg-[#d7ff47] px-3 py-2 text-[10px] font-black uppercase">{mode === "groq" ? "Live AI" : "Demo AI"}</span></div>
        <div className="space-y-5 p-5 sm:p-7">{messages.map((message) => <MessageBubble key={message.id} message={message} />)}{busy && <div className="w-fit rounded-full bg-black/5 px-4 py-2 text-xs font-black text-black/45">Analyzing catalog…</div>}</div>
        <div className="border-t border-black/10 bg-white/70 p-4 sm:p-5"><AiQuickPrompts onPick={send} /><div className="mt-3"><AiComposer onSend={send} busy={busy} /></div></div>
      </section>
      <aside className="space-y-4"><AiSearchIntent intent={intent} /><div className="rounded-[28px] bg-[#171714] p-6 text-white"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#d7ff47]">What AI can do</p><ul className="mt-4 space-y-3 text-sm font-bold text-white/75"><li>✓ Budget-aware recommendations</li><li>✓ Natural-language product search</li><li>✓ Stock + rating aware shortlist</li><li>✓ Product comparison guidance</li><li>✓ Groq-ready server route</li></ul></div></aside>
    </div>
  );
}
