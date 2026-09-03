import { catalogProducts } from "@/lib/catalog-data";
import type { CatalogProduct } from "@/types/catalog";
import type { AiComparisonRow } from "@/types/ai";

export const aiQuickPrompts = [
  "₹1,500 ke andar ghar ke liye best Ganesh murti dikhao",
  "Shadu Mati aur Seed Ganesh me kya difference hai?",
  "12–18 inch premium murti suggest karo",
  "Society ke liye large eco Ganesh options compare karo",
];

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function getAiFeaturedProducts() {
  return [...catalogProducts].sort((a, b) => b.popularity - a.popularity).slice(0, 6);
}

export function getComparisonProducts(): CatalogProduct[] {
  const slugs = ["shree-shadu-ganesh-12", "vriksha-seed-ganesh-10", "rajadhiraj-premium-18"];
  return slugs.map((slug) => catalogProducts.find((product) => product.slug === slug)).filter(Boolean) as CatalogProduct[];
}

export function buildComparisonRows(products: CatalogProduct[]): AiComparisonRow[] {
  const lowestPrice = Math.min(...products.map((product) => product.price));
  const bestRating = Math.max(...products.map((product) => product.rating));
  const mostReviews = Math.max(...products.map((product) => product.reviews));
  const mostStock = Math.max(...products.map((product) => product.inventory));

  return [
    { label: "Price", values: products.map((p) => formatInr(p.price)), winner: products.findIndex((p) => p.price === lowestPrice) },
    { label: "Rating", values: products.map((p) => `${p.rating}/5`), winner: products.findIndex((p) => p.rating === bestRating) },
    { label: "Reviews", values: products.map((p) => p.reviews.toLocaleString("en-IN")), winner: products.findIndex((p) => p.reviews === mostReviews) },
    { label: "Availability", values: products.map((p) => `${p.inventory} available`), winner: products.findIndex((p) => p.inventory === mostStock) },
    { label: "Delivery", values: products.map((p) => p.delivery) },
    { label: "Best for", values: products.map((p) => p.tags.slice(0, 2).join(" + ")) },
  ];
}
