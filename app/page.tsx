import { catalogProducts } from "@/lib/catalog-data";
import { mapBackendProductToCatalog } from "@/lib/catalog-backend";
import { listProducts } from "@/lib/db/products";
import { demoCatalogEnabled } from "@/lib/storefront/catalog-query";
import { buildHomepageCollection } from "@/lib/storefront/homepage-collection";
import { LiveStorefrontHome } from "@/components/home/live-storefront-home";
import { getPublishedHomepageBanners } from "@/lib/home-banners";
import { applyHomepageCategoryDisplay,listHomepageCategoryDisplay } from "@/lib/storefront/homepage-category-display";
import type { CatalogProduct } from "@/types/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const demo = demoCatalogEnabled();
  let products: CatalogProduct[] = [];
  let unavailable = false;
  if (demo) {
    // Explicit QA/preview mode only. The public storefront never silently
    // substitutes sample data for a failed live catalog.
    products = catalogProducts;
  } else {
    try {
      const result = await listProducts({ sort: "newest", limit: 48 });
      products = result.items.map(mapBackendProductToCatalog);
    } catch (error) {
      unavailable = true;
      console.error("NEXORA homepage catalog unavailable",
        error instanceof Error ? error.name : "Unknown database error");
    }
  }
  const banners = !demo && !unavailable ? await getPublishedHomepageBanners() : [];
  let collection=buildHomepageCollection(products);
  if(!demo && !unavailable){
    try{
      collection=applyHomepageCategoryDisplay(collection,await listHomepageCategoryDisplay());
    }catch(error){
      console.error("NEXORA homepage category display unavailable",
        error instanceof Error?error.name:"Unknown error");
    }
  }
  return <LiveStorefrontHome collection={collection}
    demo={demo} unavailable={unavailable} banners={banners} />;
}
