import type { Product } from "@/types/commerce";
import type { Brand, Promo, SearchTrend, SocialProof } from "@/types/home";
import { featuredProducts } from "@/lib/store-data";

export const brands: Brand[] = [
  { name: "Prakriti Studio", label: "Shadu Mati", href: "/category/shadu-mati" },
  { name: "Prakriti Earth", label: "Seed Ganesh", href: "/category/seed-ganesh" },
  { name: "Prakriti Artisan", label: "Premium", href: "/category/premium" },
  { name: "Natural Finish", label: "Raw clay", href: "/category/natural-finish" },
  { name: "Home Collection", label: "Compact", href: "/category/home-murtis" },
  { name: "Society Orders", label: "Bulk", href: "/category/bulk-orders" },
];

export const promos: Promo[] = [
  {
    eyebrow: "Natural clay",
    title: "Celebrate Bappa with materials that return gently to nature.",
    description: "Explore handcrafted Shadu Mati murtis with earthy texture and traditional detailing.",
    cta: "Shop Shadu Mati",
    href: "/category/shadu-mati",
    image: "https://images.unsplash.com/photo-1622033482784-86c436688b36?auto=format&fit=crop&w=1400&q=85",
    tone: "warm",
  },
  {
    eyebrow: "Plant after visarjan",
    title: "A greener ritual with Seed Ganesh.",
    description: "Thoughtful eco options for families who want the celebration to leave something living behind.",
    cta: "Explore Seed Ganesh",
    href: "/category/seed-ganesh",
    image: "https://images.unsplash.com/photo-1753545245731-1f37d75d891a?auto=format&fit=crop&w=1200&q=85",
    tone: "lime",
  },
  {
    eyebrow: "Society & office orders",
    title: "Planning a larger celebration? We can help you choose at scale.",
    description: "Browse bigger sizes and bulk-order friendly collections for communities and teams.",
    cta: "View bulk collection",
    href: "/category/bulk-orders",
    image: "https://images.unsplash.com/photo-1769326309581-7419e22c6eee?auto=format&fit=crop&w=1200&q=85",
    tone: "dark",
  },
];

export const trendingSearches: SearchTrend[] = [
  { label: "Shadu Mati Ganesh", href: "/search?q=shadu+mati+ganesh" },
  { label: "8 inch Ganesh", href: "/search?q=8+inch+ganesh" },
  { label: "Seed Ganesh", href: "/search?q=seed+ganesh" },
  { label: "Natural clay", href: "/search?q=natural+clay" },
  { label: "Premium Ganesh", href: "/search?q=premium+ganesh" },
  { label: "Bulk Ganesh order", href: "/search?q=bulk+ganesh" },
];

export const socialProof: SocialProof[] = [
  { value: "Natural", label: "clay-forward materials" },
  { value: "Handmade", label: "artisan crafted murtis" },
  { value: "Pan-India", label: "delivery-ready storefront" },
  { value: "Eco", label: "visarjan-conscious collection" },
];

export const flashDealProducts: Product[] = featuredProducts.slice(0, 6);
export const newArrivalProducts: Product[] = [
  featuredProducts[6],
  featuredProducts[2],
  featuredProducts[3],
  featuredProducts[0],
];
export const personalizedProducts: Product[] = [
  featuredProducts[1],
  featuredProducts[4],
  featuredProducts[5],
  featuredProducts[7],
];
export const recentProducts: Product[] = [
  featuredProducts[0],
  featuredProducts[3],
  featuredProducts[2],
  featuredProducts[6],
];
