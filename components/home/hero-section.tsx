import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function HeroSection() {
  return (
    <section className="overflow-hidden py-2.5 sm:py-5">
      <Container>
        <div className="soft-grid relative overflow-hidden rounded-[24px] bg-[#171714] text-white sm:rounded-[36px]">
          <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#d7ff47]/20 blur-3xl" />
          <div className="grid min-h-[520px] sm:min-h-[610px] lg:min-h-[590px] lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10 flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
              <Badge tone="accent">New season edit</Badge>
              <h1 className="text-balance mt-4 max-w-3xl text-[clamp(2.5rem,13vw,7.5rem)] font-black leading-[0.86] tracking-[-0.07em]">
                SHOP
                <span className="block text-[#d7ff47]">BEYOND</span>
                ORDINARY.
              </h1>
              <p className="mt-4 max-w-xl text-[13px] leading-5 text-white/65 sm:mt-6 sm:text-base sm:leading-6">
                Premium picks, clear pricing and smarter discovery — made for fast everyday shopping.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
                <Button href="/shop" variant="accent">Shop now →</Button>
                <Button href="/new" variant="light">New arrivals</Button>
              </div>
              <div className="mt-6 grid max-w-xl grid-cols-3 gap-2 border-t border-white/10 pt-4 sm:mt-10 sm:gap-3 sm:pt-6">
                <div><p className="text-lg font-black sm:text-2xl">10k+</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/40">Curated picks</p></div>
                <div><p className="text-lg font-black sm:text-2xl">4.8/5</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/40">Shop rating</p></div>
                <div><p className="text-lg font-black sm:text-2xl">24/7</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/40">Smart help</p></div>
              </div>
            </div>

            <div className="relative min-h-[260px] overflow-hidden sm:min-h-[380px] lg:min-h-full">
              <div className="absolute inset-x-4 bottom-0 top-2 overflow-hidden rounded-t-[28px] bg-[#d7ff47] sm:inset-x-10 sm:top-8 lg:left-0 lg:right-8">
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
              <div className="glass-panel absolute bottom-5 left-3 max-w-[205px] rounded-2xl p-3 text-black sm:bottom-10 sm:left-7 sm:max-w-[235px] sm:rounded-3xl sm:p-4 lg:left-[-36px]">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-black/45">Smart discovery</p>
                <p className="mt-1.5 text-base font-black leading-tight tracking-[-0.03em] sm:mt-2 sm:text-lg">Your taste. Better picks.</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
