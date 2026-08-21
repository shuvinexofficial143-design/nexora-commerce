import type { AiMessage as AiMessageType } from "@/types/ai";
import { AiProductStrip } from "@/components/ai/ai-product-strip";

export function AiMessage({ message }: { message: AiMessageType }) {
  const assistant = message.role === "assistant";
  return (
    <div className={`flex ${assistant ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[92%] sm:max-w-[82%] ${assistant ? "" : "rounded-[28px] bg-[#151512] px-5 py-4 text-white"}`}>
        {assistant && <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-black/45">NEXORA AI</div>}
        <p className={`text-sm leading-7 ${assistant ? "rounded-[28px] border border-black/10 bg-white px-5 py-4 text-black/80 shadow-sm" : ""}`}>{message.content}</p>
        {assistant && message.products?.length ? <AiProductStrip products={message.products} /> : null}
      </div>
    </div>
  );
}
