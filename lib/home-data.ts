import type { Product } from "@/types/commerce";
import type { Brand, Promo, SearchTrend, SocialProof } from "@/types/home";
import { featuredProducts } from "@/lib/store-data";

export const brands: Brand[] = [
  { name: "Auralab", label: "Audio", href: "/brand/auralab" },
  { name: "NORTHLINE", label: "Streetwear", href: "/brand/northline" },
  { name: "forme", label: "Home", href: "/brand/forme" },
  { name: "MORI", label: "Watches", href: "/brand/mori" },
  { name: "SEREIN", label: "Beauty", href: "/brand/serein" },
  { name: "KINETIC", label: "Fitness", href: "/brand/kinetic" },
];

export const promos: Promo[] = [
  {
    eyebrow: "Creator setup",
    title: "Build a desk that makes focus easier.",
    description: "Clean tech, considered lighting and tools selected for a calmer workflow.",
    cta: "Shop the edit",
    href: "/collections/creator-desk",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85",
    tone: "dark",
  },
  {
    eyebrow: "Move daily",
    title: "Training essentials, minus the noise.",
    description: "Performance pieces for gym sessions, walks and everything between.",
    cta: "Explore fitness",
    href: "/category/fitness",
    image: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=85",
    tone: "lime",
  },
  {
    eyebrow: "Home reset",
    title: "Small changes. Better spaces.",
    description: "Warm textures and functional objects that make a room feel finished.",
    cta: "Refresh your space",
    href: "/category/home",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85",
    tone: "warm",
  },
];

export const trendingSearches: SearchTrend[] = [
  { label: "Wireless headphones", href: "/search?q=wireless+headphones" },
  { label: "Running shoes", href: "/search?q=running+shoes" },
  { label: "Minimal watches", href: "/search?q=minimal+watches" },
  { label: "Skincare sets", href: "/search?q=skincare+sets" },
  { label: "Desk setup", href: "/search?q=desk+setup" },
  { label: "Travel bags", href: "/search?q=travel+bags" },
];

export const socialProof: SocialProof[] = [
  { value: "4.8/5", label: "average product rating" },
  { value: "24h", label: "priority dispatch on eligible items" },
  { value: "10k+", label: "happy early shoppers" },
  { value: "7-day", label: "easy return window" },
];

export const flashDealProducts: Product[] = featuredProducts.slice(0, 6);
export const newArrivalProducts: Product[] = [
  featuredProducts[6],
  featuredProducts[3],
  featuredProducts[4],
  featuredProducts[1],
];
export const personalizedProducts: Product[] = [
  featuredProducts[7],
  featuredProducts[0],
  featuredProducts[5],
  featuredProducts[2],
];
export const recentProducts: Product[] = [
  featuredProducts[2],
  featuredProducts[6],
  featuredProducts[1],
  featuredProducts[7],
];
