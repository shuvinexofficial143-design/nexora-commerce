import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getPublishedHomepageBanners } from "@/lib/home-banners";

export async function HeroSection() {
  const banners = await getPublishedHomepageBanners();
  const banner = banners[0];
  const image = banner?.imageUrl ?? "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=85";
  const mobileImage = banner?.mobileImageUrl ?? image;
  const title = banner?.title ?? "SHOP BEYOND ORDINARY.";
  const description = banner?.description ?? "Premium picks, clear pricing and smarter discovery — made for fast everyday shopping.";
  const href = banner?.ctaHref ?? "/shop";
  const cta = banner?.ctaText ?? "Shop now →";
  return (
    <section className="overflow-hidden py-2 sm:py-5">
      <Container>
        <div className="sm:hidden">
          <Link
              href={href}
            className="relative block h-[150px] overflow-hidden rounded-[22px] bg-[#ffd83d]"
          >
            <Image
              src={mobileImage}
              alt="New season collection"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex w-[62%] flex-col justify-center px-4 text-white">
              <span className="w-fit rounded-full bg-[#d7ff47] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-black">
                New drop
              </span>
              <h1 className="mt-2 text-[24px] font-black leading-[0.92] tracking-[-0.05em]">
                {title}
              </h1>
              <p className="mt-2 text-[11px] font-semibold text-white/85">Fresh picks. Better prices.</p>
            </div>
            <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-black text-black shadow-sm">→</span>
          </Link>
        </div>

        <div className="soft-grid relative hidden overflow-hidden rounded-[36px] bg-[#171714] text-white sm:block">
          <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#d7ff47]/20 blur-3xl" />
          <div className="grid min-h-[610px] lg:min-h-[590px] lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10 flex flex-col justify-center px-10 py-12 lg:px-14 lg:py-16">
              <Badge tone="accent">{banner?.categorySlug ? `${banner.categorySlug} collection` : "NEXORA marketplace"}</Badge>
              <h1 className="text-balance mt-4 max-w-3xl text-[clamp(3.2rem,8vw,7.5rem)] font-black leading-[0.86] tracking-[-0.07em]">
                {title}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-6 text-white/65">
                {description}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href={href} variant="accent">{cta}</Button>
                <Button href="/shop?sort=newest" variant="light">New arrivals</Button>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-white/10 pt-6">
                <div><p className="text-2xl font-black">10k+</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/40">Curated picks</p></div>
                <div><p className="text-2xl font-black">4.8/5</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/40">Shop rating</p></div>
                <div><p className="text-2xl font-black">24/7</p><p className="mt-1 text-[9px] uppercase tracking-widest text-white/40">Smart help</p></div>
              </div>
            </div>

            <div className="relative min-h-[380px] overflow-hidden lg:min-h-full">
              <div className="absolute inset-x-10 bottom-0 top-8 overflow-hidden rounded-t-[34px] bg-[#d7ff47] lg:left-0 lg:right-8">
                <Image
                  src={image}
                  alt={title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </div>
              <div className="glass-panel absolute bottom-10 left-7 max-w-[235px] rounded-3xl p-4 text-black lg:left-[-36px]">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-black/45">Smart discovery</p>
                <p className="mt-2 text-lg font-black leading-tight tracking-[-0.03em]">Your taste. Better picks.</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
