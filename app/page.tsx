import { AppDownloadBanner } from "@/components/home/app-download-banner";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { CategoryStrip } from "@/components/home/category-strip";
import { DealStrip } from "@/components/home/deal-strip";
import { EditorialBanner } from "@/components/home/editorial-banner";
import { FeaturedBrands } from "@/components/home/featured-brands";
import { FlashDealsSection } from "@/components/home/flash-deals-section";
import { FlashSaleSpotlight } from "@/components/home/flash-sale-spotlight";
import { HeroSection } from "@/components/home/hero-section";
import { MemberBanner } from "@/components/home/member-banner";
import { NewArrivalsSection } from "@/components/home/new-arrivals-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { PersonalizedSection } from "@/components/home/personalized-section";
import { PromoGrid } from "@/components/home/promo-grid";
import { RecentlyViewedSection } from "@/components/home/recently-viewed-section";
import { SocialProofStrip } from "@/components/home/social-proof-strip";
import { TrendingSearches } from "@/components/home/trending-searches";
import { TrustStrip } from "@/components/home/trust-strip";
import { mapBackendProductToCatalog } from "@/lib/catalog-backend";
import { catalogProducts } from "@/lib/catalog-data";
import { listProducts } from "@/lib/db/products";
import type { CatalogProduct } from "@/types/catalog";

export const revalidate = 60;

async function loadHomepageCatalog(): Promise<CatalogProduct[]> {
  try {
    const result = await listProducts({ limit: 100 });
    return result.items.map(mapBackendProductToCatalog);
  } catch (error) {
    console.warn("NEXORA homepage database catalog unavailable; using bundled fallback.", error);
    return catalogProducts;
  }
}

function discount(product: CatalogProduct) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
  return (product.compareAtPrice - product.price) / product.compareAtPrice;
}

export default async function HomePage() {
  const products = await loadHomepageCatalog();
  const newArrivals = [...products]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const flashDeals = [...products]
    .filter((product) => product.stock !== "out-of-stock")
    .sort((a, b) => discount(b) - discount(a) || b.popularity - a.popularity)
    .slice(0, 6);
  const personalized = [...products]
    .filter((product) => product.stock !== "out-of-stock")
    .sort((a, b) => b.popularity - a.popularity || b.rating - a.rating)
    .slice(0, 4);
  const continuation = [...products]
    .filter((product) => !personalized.some((item) => item.id === product.id))
    .slice(0, 4);

  return (
    <>
      <HeroSection />
      <CategoryStrip />
      <NewArrivalsSection products={newArrivals} />
      <TrendingSearches />
      <FlashSaleSpotlight />
      <FlashDealsSection products={flashDeals} />
      <FeaturedBrands />
      <EditorialBanner />
      <CategoryShowcase />
      <PromoGrid />
      <PersonalizedSection products={personalized} />
      <DealStrip />
      <MemberBanner />
      <RecentlyViewedSection products={continuation.length ? continuation : personalized} />
      <AppDownloadBanner />
      <SocialProofStrip />
      <NewsletterSection />
      <TrustStrip />
    </>
  );
}
