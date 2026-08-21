import { aiQuickPrompts } from "@/lib/ai-commerce";

export function AiQuickPrompts({ onPick }: { onPick: (prompt: string) => void }) {
  return <div className="flex flex-wrap gap-2">{aiQuickPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => onPick(prompt)} className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black text-black/65 transition hover:border-black/30 hover:text-black">{prompt}</button>)}</div>;
}
