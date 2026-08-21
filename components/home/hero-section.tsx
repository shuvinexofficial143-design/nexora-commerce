import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function HeroSection() {
  return (
    <section className="overflow-hidden py-4 sm:py-6">
      <Container>
        <div className="soft-grid relative overflow-hidden rounded-[30px] bg-[#171714] text-white sm:rounded-[42px]">
          <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#d7ff47]/20 blur-3xl" />
          <div className="grid min-h-[650px] lg:min-h-[590px] lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
              <Badge tone="accent">Nexora launch edit</Badge>
              <h1 className="text-balance mt-5 max-w-3xl text-[clamp(3.2rem,8vw,7.5rem)] font-black leading-[0.84] tracking-[-0.075em]">
                SHOP
                <span className="block text-[#d7ff47]">BEYOND</span>
                ORDINARY.
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-6 text-white/62 sm:text-base">
                Premium discovery, transparent pricing and an AI-ready shopping experience — designed to feel fast before it even feels familiar.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href="/shop" variant="accent">Start shopping →</Button>
                <Button href="/new" variant="light">See what&apos;s new</Button>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-white/10 pt-6">
                <div><p className="text-xl font-black sm:text-2xl">10k+</p><p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">Curated picks</p></div>
                <div><p className="text-xl font-black sm:text-2xl">4.8/5</p><p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">Shop rating</p></div>
                <div><p className="text-xl font-black sm:text-2xl">24/7</p><p className="mt-1 text-[10px] uppercase tracking-widest text-white/40">Smart help</p></div>
              </div>
            </div>

            <div className="relative min-h-[420px] overflow-hidden lg:min-h-full">
              <div className="absolute inset-x-6 bottom-0 top-4 overflow-hidden rounded-t-[34px] bg-[#d7ff47] sm:inset-x-10 lg:left-0 lg:right-8 lg:top-8">
                <Image
                  src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=85"
                  alt="Curated premium fashion collection"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </div>
              <div className="glass-panel float-card absolute bottom-10 left-4 max-w-[235px] rounded-3xl p-4 text-black sm:left-7 lg:left-[-36px] lg:bottom-12">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-black/45">Smart discovery</p>
                <p className="mt-2 text-lg font-black leading-tight tracking-[-0.03em]">Your taste. Your budget. Better picks.</p>
                <p className="mt-3 text-xs font-bold">AI shopping arrives in Batch 12 →</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
