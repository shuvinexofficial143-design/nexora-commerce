import Link from "next/link";
import { Container } from "@/components/ui/container";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { AiRecommendationGrid } from "@/components/ai/ai-recommendation-grid";

export function AiShopShell() {
  return (
    <div className="soft-grid min-h-[80vh] py-10 sm:py-14">
      <Container>
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="rounded-full bg-[#1f3a2e] px-4 py-2 text-[11px] font-black uppercase tracking-[.18em] text-[#f4d7a1]">
              Prakriti Ganesh Guide
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-.05em] text-[#1f3a2e] sm:text-6xl">
              Find the right Bappa for your celebration.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-black/55">
              Budget, height, Shadu Mati, Seed Ganesh, natural finish, gifting ya society requirement normal language me batao. Assistant catalog se suitable murtis shortlist karega.
            </p>
          </div>
          <Link href="/shop" className="w-fit rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-black">
            Browse all murtis →
          </Link>
        </div>
        <AiChatPanel />
        <AiRecommendationGrid />
      </Container>
    </div>
  );
}
