import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { personalizedProducts } from "@/lib/home-data";

export function PersonalizedSection() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="overflow-hidden rounded-[34px] bg-[#171714] p-6 text-white sm:p-9 lg:p-12">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d7ff47]">Made for your feed</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">A smarter shelf, ready to personalize.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">This preview will later be powered by browsing, wishlist and purchase signals. For now, it demonstrates the personalized shopping layout.</p>
          </div>
          <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5 [&_article]:text-white [&_article_.text-black\/40]:text-white/40 [&_article_.text-black\/35]:text-white/35 [&_article_.text-black\/50]:text-white/50">
            {personalizedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </Container>
    </section>
  );
}
