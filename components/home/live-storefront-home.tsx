import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { CatalogProductCard } from "@/components/catalog/catalog-product-card";
import type { HomepageCollection } from "@/lib/storefront/homepage-collection";
import type { HomepageBannerData } from "@/lib/home-banners";

type Props = {
  collection: HomepageCollection;
  demo: boolean;
  unavailable: boolean;
  banners: HomepageBannerData[];
};

function CatalogSection({ title, eyebrow, description, products }: {
  title:string; eyebrow:string; description:string;
  products: HomepageCollection["recent"];
}) {
  if (!products.length) return null;
  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.22em] text-black/45">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.055em] sm:text-5xl">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-black/60">{description}</p>
          </div>
          <Link href="/shop?sort=newest" className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-[#d7ff47]">
            View all products →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {products.map(p => <CatalogProductCard key={p.slug} product={p} />)}
        </div>
      </Container>
    </section>
  );
}

export function LiveStorefrontHome({ collection, demo, unavailable, banners }: Props) {
  const featured = collection.spotlight;
  const heroBanner = !demo && !unavailable ? banners[0] : undefined;
  const secondaryBanners = !demo && !unavailable ? banners.slice(1,5) : [];
  return (
    <main className="pb-16">
      <Container>
        {demo ? (
          <div role="status" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-950">
            DEMO PREVIEW ONLY — these are sample products and example prices. They are not live stock and checkout is not enabled.
          </div>
        ) : null}
        <section className="relative mt-4 overflow-hidden rounded-[32px] bg-[#171b17] text-white sm:mt-6 sm:rounded-[42px]">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#d7ff47]/20 blur-[90px]" />
          <div className="absolute -bottom-32 right-16 h-80 w-80 rounded-full bg-emerald-400/10 blur-[85px]" />
          <div className="relative grid min-h-[440px] gap-0 lg:min-h-[560px] lg:grid-cols-[1.1fr_.9fr]">
            <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16">
              <p className="w-fit rounded-full border border-white/20 px-4 py-2 text-[11px] font-black uppercase tracking-[.25em] text-[#d7ff47]">NEXORA / EVERYDAY DISCOVERY</p>
              <h1 className="mt-6 max-w-[650px] text-[clamp(3.2rem,7.5vw,7rem)] font-black leading-[.88] tracking-[-.075em]">
                {heroBanner ? heroBanner.title : <>
                  FIND YOUR
                  <span className="mt-1 block text-[#d7ff47]">NEXT THING.</span>
                </>}
              </h1>
              <p className="mt-6 max-w-[490px] text-base leading-7 text-white/70">
                {heroBanner?.description ?? "Explore thoughtful finds across the categories you love, with transparent product information and a clean shopping experience."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={heroBanner?.ctaHref ?? "/shop"} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d7ff47] px-7 py-3 text-sm font-black text-black hover:bg-[#c6ef37]">{heroBanner?.ctaText ?? "Explore collection"} →</Link>
                <Link href="/search" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-7 py-3 text-sm font-black text-white hover:bg-white/10">Find a product</Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-3 text-[11px] font-bold text-white/65">
                <span className="rounded-full border border-white/15 px-3 py-2">Browse by category</span>
                <span className="rounded-full border border-white/15 px-3 py-2">Check availability</span>
                <span className="rounded-full border border-white/15 px-3 py-2">Track your order</span>
              </div>
            </div>
            <div className="relative flex min-h-[270px] flex-col justify-end overflow-hidden bg-[#2b3328] lg:min-h-full">
              {heroBanner ? <>
                <Image src={heroBanner.imageUrl} alt={heroBanner.title} fill priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className={`object-cover ${heroBanner.mobileImageUrl ? "hidden sm:block" : ""}`}/>
                {heroBanner.mobileImageUrl ? <Image src={heroBanner.mobileImageUrl}
                  alt={heroBanner.title} fill priority sizes="100vw" className="object-cover sm:hidden"/> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
                <div className="relative p-7 sm:p-9">
                  <p className="text-xs font-black tracking-widest text-white">NEXORA COLLECTION</p>
                  <p className="mt-2 text-sm font-semibold text-white/85">{heroBanner.title}</p>
                </div>
              </> : featured ? <>
                <Image src={featured.image} alt={featured.name} fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="relative p-7 sm:p-9">
                  <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#d7ff47]">{demo ? "Sample product" : "New in the collection"}</p>
                  <h2 className="mt-2 max-w-sm text-2xl font-black leading-tight tracking-[-.04em]">{featured.name}</h2>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <span className="text-lg font-black">₹{featured.price.toLocaleString("en-IN")}</span>
                    <Link href={ "/product/"+encodeURIComponent(featured.slug) } className="rounded-full bg-white px-4 py-2 text-xs font-black text-black">View product →</Link>
                  </div>
                </div>
              </> : <div className="relative grid min-h-[300px] place-content-center gap-4 p-10 text-center">
                <div className="text-[90px] font-black leading-none tracking-[-.1em] text-[#d7ff47]">NX.</div>
                <p className="text-sm font-semibold text-white/70">Your next discovery starts here.</p>
              </div>}
            </div>
          </div>
        </section>
        {secondaryBanners.length ? <section aria-label="More featured collections"
          className="mt-6 grid gap-4 sm:grid-cols-2">
          {secondaryBanners.map(banner=><Link key={banner.id} href={banner.ctaHref}
            className="group relative flex min-h-[220px] overflow-hidden rounded-[26px] bg-[#19221b] text-white">
            <Image src={banner.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover opacity-70 transition-transform group-hover:scale-105"/>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"/>
            <div className="relative flex flex-col justify-end p-6">
              <h2 className="text-2xl font-black">{banner.title}</h2>
              {banner.description ? <p className="mt-2 max-w-sm text-sm text-white/80">{banner.description}</p> : null}
              <span className="mt-4 text-sm font-black text-[#d7ff47]">{banner.ctaText} →</span>
            </div>
          </Link>)}
        </section> : null}
        {unavailable || (!demo && !collection.categories.length) ? (
          <section role="status" className="mt-8 rounded-3xl border border-amber-200 bg-white p-7 sm:p-10">
            <h2 className="text-xl font-black">{unavailable ? "Live products are temporarily unavailable" : "The collection is being prepared"}</h2>
            <p className="mt-2 text-sm text-black/60">
              {unavailable ? "The product database could not be reached. No sample inventory or prices are shown as live products." : "No published products are available yet. Return when the collection is updated."}
            </p>
            <Link href="/shop" className="mt-5 inline-block rounded-full bg-black px-6 py-3 text-sm font-black text-white">Check the shop →</Link>
          </section>
        ) : null}
        {collection.categories.length ? (
          <section className="py-10 sm:py-16" aria-label="Browse categories">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[.2em] text-black/45">Browse your way</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.055em] sm:text-5xl">Find your category.</h2>
              </div>
              <Link className="text-sm font-black underline underline-offset-4" href="/shop">All products →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
              {collection.categories.map(category => (
                <Link key={category.slug} href={"/shop?category="+encodeURIComponent(category.slug)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#2d332a] text-white sm:rounded-[28px]">
                  <Image src={category.image} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover opacity-85 transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <h3 className="text-lg font-black tracking-[-.03em] sm:text-xl">{category.name}</h3>
                    <p className="mt-1 text-[11px] font-bold text-white/75">{category.productCount} {category.productCount===1?"item":"items"} in current selection →</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </Container>
      <CatalogSection eyebrow="Recently added" title="Fresh from the collection." description="Products currently available to explore, ordered by their published dates." products={collection.recent}/>
      <CatalogSection eyebrow="Explore more" title="More to discover." description="Another look across the available catalog." products={collection.discover}/>
      {collection.brands.length ? (
        <section className="py-8 sm:py-12">
          <Container>
            <h2 className="text-3xl font-black tracking-[-.055em] sm:text-4xl">Brands in this collection.</h2>
            <p className="mt-2 text-sm text-black/60">Brand names are drawn from listed products, not promotional endorsements.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {collection.brands.map(brand => <Link key={brand.name} href={brand.href}
                className="flex min-h-28 flex-col justify-center rounded-[22px] border border-black/10 bg-white p-5 transition hover:border-black/30">
                <span className="text-lg font-black">{brand.name}</span>
                <span className="mt-2 text-[11px] font-bold text-black/50">Explore brand →</span>
              </Link>)}
            </div>
          </Container>
        </section>
      ) : null}
      <Container>
        <section className="mt-8 grid gap-5 rounded-[34px] bg-[#d7ff47] px-6 py-9 sm:px-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.24em]">Clear shopping</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-5xl">Know what you&apos;re choosing.</h2>
            <p className="mt-3 max-w-xl text-sm font-semibold text-black/65">Review product options, check current pricing and availability, and track an existing order. No invented delivery guarantees or ratings.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className="rounded-full bg-black px-6 py-3.5 text-sm font-black text-white">Shop products →</Link>
            <Link href="/track-order" className="rounded-full border border-black/20 px-6 py-3.5 text-sm font-black text-black">Track order</Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
