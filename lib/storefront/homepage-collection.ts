import type { CatalogProduct } from "@/types/catalog";

export type HomepageCategory = {
  slug: string;
  name: string;
  image: string;
  productCount: number;
};

export type HomepageCollection = {
  categories: HomepageCategory[];
  recent: CatalogProduct[];
  discover: CatalogProduct[];
  spotlight: CatalogProduct | null;
  brands: Array<{ name: string; count: number; href: string }>;
};

const safeSlug = /^[a-z0-9][a-z0-9-]{0,63}$/;
function labelFromSlug(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b[a-z]/g, letter => letter.toUpperCase());
}
function created(product: CatalogProduct) {
  const date = Date.parse(product.createdAt);
  return Number.isFinite(date) ? date : 0;
}

/** Never use hardcoded sample inventory or invented category counts on the live home.
 * Input MUST be the currently published product result from a trusted database call.
 */
export function buildHomepageCollection(products: readonly CatalogProduct[]): HomepageCollection {
  const distinct = new Map<string, CatalogProduct>();
  for (const product of products) {
    if (!safeSlug.test(product.slug) || distinct.has(product.slug)) continue;
    distinct.set(product.slug, product);
  }
  const all = [...distinct.values()];
  const available = all.filter(product => product.inventory > 0 && product.stock !== "out-of-stock");
  const sorted = [...available].sort((a, b) =>
    created(b) - created(a) || a.slug.localeCompare(b.slug));
  // A featured product only comes from the actual published/preview inventory.
  const spotlight = sorted[0] ?? null;
  const recent = sorted.slice(0, 8);
  const recentSlugs = new Set(recent.map(product => product.slug));
  const discover = [...available].filter(p => !recentSlugs.has(p.slug))
    .sort((a,b) => b.popularity-a.popularity || a.slug.localeCompare(b.slug))
    .slice(0, 4);
  const categories = new Map<string,HomepageCategory>();
  const brands = new Map<string,{name:string;count:number;href:string}>();
  for (const product of all) {
    const slug = product.category;
    if (safeSlug.test(slug)) {
      const current = categories.get(slug);
      if (current) {
        current.productCount++;
        if (product.inventory > 0 && current.image === "/product-placeholder.svg")
          current.image = product.image;
      } else categories.set(slug, { slug, name: labelFromSlug(slug),
        image: product.image || "/product-placeholder.svg", productCount: 1 });
    }
    const brand = product.brand?.trim() ?? "";
    if (brand && brand !== "Unbranded" && brand.length <= 80) {
      const value = brands.get(brand.toLowerCase());
      if (value) value.count++;
      else brands.set(brand.toLowerCase(),{
        name:brand,count:1,href:"/search?q="+encodeURIComponent(brand),
      });
    }
  }
  return {
    categories:[...categories.values()].sort((a,b)=>b.productCount-a.productCount || a.slug.localeCompare(b.slug)).slice(0,8),
    brands:[...brands.values()].sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name)).slice(0,8),
    recent,discover,spotlight,
  };
}
