type CatalogHeroProps = {
  productCount: number;
};

export function CatalogHero({ productCount }: CatalogHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-[#171714] px-5 py-8 text-white sm:rounded-[38px] sm:px-8 sm:py-11 lg:px-12">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#d7ff47]/20 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="relative max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d7ff47]">Nexora collection</p>
        <h1 className="mt-3 text-balance text-4xl font-black tracking-[-0.055em] sm:text-5xl lg:text-6xl">
          Find the right thing, faster.
        </h1>
        <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-white/65 sm:text-base">
          Browse {productCount}+ curated picks with fast filtering by category, brand, budget, rating, availability and discount.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
          {['Fast delivery', 'Verified ratings', 'Easy returns', 'Secure checkout'].map((item) => (
            <span key={item} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
