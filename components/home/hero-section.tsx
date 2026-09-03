import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const heroImage = "https://images.unsplash.com/photo-1753545245731-1f37d75d891a?auto=format&fit=crop&w=1600&q=88";

export function HeroSection() {
  return (
    <section className="overflow-hidden py-2 sm:py-5">
      <Container>
        <div className="sm:hidden">
          <Link
            href="/shop"
            className="relative block h-[205px] overflow-hidden rounded-[24px] bg-[#dce8cf]"
          >
            <Image src={heroImage} alt="Handcrafted Ganesh murti" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#173228]/80 via-[#173228]/35 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex w-[72%] flex-col justify-center px-4 text-white">
              <span className="w-fit rounded-full bg-[#f6c453] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#1f3a2e]">
                Ganesh Chaturthi 2026
              </span>
              <h1 className="mt-2 text-[26px] font-black leading-[0.92] tracking-[-0.05em]">
                Bappa bhi.
                <span className="block text-[#f6c453]">Prakriti bhi.</span>
              </h1>
              <p className="mt-2 text-[11px] font-semibold leading-4 text-white/85">Natural clay · handmade · eco-friendly visarjan</p>
            </div>
            <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-black text-[#1f3a2e] shadow-sm">→</span>
          </Link>
        </div>

        <div className="relative hidden overflow-hidden rounded-[38px] bg-[#1f3a2e] text-white sm:block">
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#f6c453]/15 blur-3xl" />
          <div className="grid min-h-[610px] lg:grid-cols-[1.03fr_.97fr]">
            <div className="relative z-10 flex flex-col justify-center px-10 py-12 lg:px-14 lg:py-16">
              <Badge tone="accent">Eco-friendly Ganesh collection</Badge>
              <h1 className="mt-4 max-w-3xl text-[clamp(3.2rem,7vw,6.6rem)] font-black leading-[0.88] tracking-[-0.065em]">
                DEVOTION
                <span className="block text-[#f6c453]">ROOTED IN</span>
                NATURE.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/70">
                Handcrafted Ganesh murtis made with natural clay and thoughtful materials — beautiful for your home, gentler for our rivers.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href="/shop" variant="accent">Shop murtis →</Button>
                <Button href="/category/shadu-mati" variant="light">Explore Shadu Mati</Button>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-white/10 pt-6">
                <div><p className="text-2xl font-black">100%</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/45">Natural clay focus</p></div>
                <div><p className="text-2xl font-black">Hand</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/45">Artisan crafted</p></div>
                <div><p className="text-2xl font-black">India</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/45">Delivery ready</p></div>
              </div>
            </div>

            <div className="relative min-h-[400px] overflow-hidden lg:min-h-full">
              <div className="absolute inset-x-10 bottom-0 top-8 overflow-hidden rounded-t-[36px] bg-[#dce8cf] lg:left-0 lg:right-8">
                <Image src={heroImage} alt="Eco-friendly Ganesh idol collection" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1f3a2e]/45 via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-10 left-7 max-w-[245px] rounded-3xl bg-[#fffaf0]/92 p-4 text-[#1f3a2e] shadow-xl backdrop-blur lg:left-[-32px]">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#a54f2a]">Made with care</p>
                <p className="mt-2 text-lg font-black leading-tight tracking-[-0.03em]">Tradition without the plastic footprint.</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
