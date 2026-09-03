import type { CatalogProduct } from "@/types/catalog";

const img = {
  clay: "https://images.unsplash.com/photo-1622033482784-86c436688b36?auto=format&fit=crop&w=900&q=85",
  workshop: "https://images.unsplash.com/photo-1753545245731-1f37d75d891a?auto=format&fit=crop&w=900&q=85",
  festive: "https://images.unsplash.com/photo-1769326309581-7419e22c6eee?auto=format&fit=crop&w=900&q=85",
  offering: "https://images.unsplash.com/photo-1773473641016-16da4d0ff6d6?auto=format&fit=crop&w=900&q=85",
  garland: "https://images.unsplash.com/photo-1769326309527-0c6fed6cfe22?auto=format&fit=crop&w=900&q=85",
  floral: "https://images.unsplash.com/photo-1756859705339-ca307a80b9ef?auto=format&fit=crop&w=900&q=85",
};

export const catalogProducts: CatalogProduct[] = [
  {
    id: "cat_001", slug: "shree-shadu-ganesh-12", name: "Shree Shadu Ganesh — 12 inch", brand: "Prakriti Studio", category: "shadu-mati",
    price: 1499, compareAtPrice: 1899, rating: 4.9, reviews: 184, badge: "Bestseller", image: img.clay, colors: ["Natural Clay", "Soft Festive"],
    stock: "in-stock", inventory: 38, delivery: "2–4 days", popularity: 99, createdAt: "2026-08-22", tags: ["shadu", "clay", "12-inch", "eco-friendly"],
  },
  {
    id: "cat_002", slug: "bal-ganesh-home-8", name: "Bal Ganesh Home Murti — 8 inch", brand: "Prakriti Studio", category: "home-murtis",
    price: 899, compareAtPrice: 1099, rating: 4.8, reviews: 126, badge: "Home favourite", image: img.floral, colors: ["Natural", "Terracotta"],
    stock: "in-stock", inventory: 52, delivery: "2–4 days", popularity: 94, createdAt: "2026-08-20", tags: ["home", "8-inch", "compact", "clay"],
  },
  {
    id: "cat_003", slug: "vriksha-seed-ganesh-10", name: "Vriksha Seed Ganesh — 10 inch", brand: "Prakriti Earth", category: "seed-ganesh",
    price: 1299, compareAtPrice: 1599, rating: 4.8, reviews: 92, badge: "Eco pick", image: img.workshop, colors: ["Earth", "Natural"],
    stock: "in-stock", inventory: 27, delivery: "3–5 days", popularity: 92, createdAt: "2026-08-25", tags: ["seed", "plantable", "10-inch", "eco-friendly"],
  },
  {
    id: "cat_004", slug: "rajadhiraj-premium-18", name: "Rajadhiraj Premium Ganesh — 18 inch", brand: "Prakriti Artisan", category: "premium",
    price: 3499, compareAtPrice: 4299, rating: 4.9, reviews: 78, badge: "Premium", image: img.garland, colors: ["Festive", "Saffron"],
    stock: "low-stock", inventory: 7, delivery: "3–5 days", popularity: 95, createdAt: "2026-08-18", tags: ["premium", "18-inch", "hand-finished", "festival"],
  },
  {
    id: "cat_005", slug: "nirmiti-natural-ganesh-11", name: "Nirmiti Natural Clay Ganesh — 11 inch", brand: "Prakriti Earth", category: "natural-finish",
    price: 1199, compareAtPrice: 1499, rating: 4.7, reviews: 64, image: img.offering, colors: ["Raw Clay"],
    stock: "in-stock", inventory: 34, delivery: "2–4 days", popularity: 84, createdAt: "2026-08-14", tags: ["natural", "raw-clay", "11-inch", "minimal"],
  },
  {
    id: "cat_006", slug: "siddhivinayak-shadu-15", name: "Siddhivinayak Shadu Ganesh — 15 inch", brand: "Prakriti Studio", category: "shadu-mati",
    price: 2299, compareAtPrice: 2799, rating: 4.9, reviews: 151, badge: "Popular", image: img.festive, colors: ["Festive", "Natural Clay"],
    stock: "in-stock", inventory: 24, delivery: "3–5 days", popularity: 97, createdAt: "2026-08-24", tags: ["shadu", "15-inch", "traditional", "eco-friendly"],
  },
  {
    id: "cat_007", slug: "modak-ganesh-mini-6", name: "Modak Ganesh Mini — 6 inch", brand: "Prakriti Studio", category: "home-murtis",
    price: 599, compareAtPrice: 749, rating: 4.7, reviews: 203, badge: "New", image: img.floral, colors: ["Natural", "Soft Red"],
    stock: "in-stock", inventory: 76, delivery: "2–4 days", popularity: 88, createdAt: "2026-08-29", tags: ["mini", "6-inch", "home", "gift"],
  },
  {
    id: "cat_008", slug: "samuhik-ganesh-24", name: "Samuhik Eco Ganesh — 24 inch", brand: "Prakriti Artisan", category: "bulk-orders",
    price: 5499, compareAtPrice: 6499, rating: 4.8, reviews: 41, image: img.workshop, colors: ["Custom Finish"],
    stock: "low-stock", inventory: 5, delivery: "5–8 days", popularity: 80, createdAt: "2026-08-12", tags: ["24-inch", "society", "bulk", "large"],
  },
  {
    id: "cat_009", slug: "morya-shadu-9", name: "Morya Shadu Ganesh — 9 inch", brand: "Prakriti Studio", category: "shadu-mati",
    price: 1099, compareAtPrice: 1399, rating: 4.8, reviews: 117, image: img.clay, colors: ["Natural Clay"],
    stock: "in-stock", inventory: 43, delivery: "2–4 days", popularity: 90, createdAt: "2026-08-10", tags: ["shadu", "9-inch", "natural", "home"],
  },
  {
    id: "cat_010", slug: "ankur-seed-ganesh-7", name: "Ankur Seed Ganesh — 7 inch", brand: "Prakriti Earth", category: "seed-ganesh",
    price: 799, compareAtPrice: 999, rating: 4.6, reviews: 83, image: img.workshop, colors: ["Earth"],
    stock: "in-stock", inventory: 61, delivery: "2–4 days", popularity: 82, createdAt: "2026-08-27", tags: ["seed", "7-inch", "plantable", "gift"],
  },
  {
    id: "cat_011", slug: "vakratunda-premium-21", name: "Vakratunda Premium Ganesh — 21 inch", brand: "Prakriti Artisan", category: "premium",
    price: 4799, compareAtPrice: 5699, rating: 4.9, reviews: 56, badge: "Artisan pick", image: img.garland, colors: ["Saffron", "Maroon"],
    stock: "low-stock", inventory: 4, delivery: "5–7 days", popularity: 91, createdAt: "2026-08-16", tags: ["premium", "21-inch", "artisan", "large"],
  },
  {
    id: "cat_012", slug: "dharti-ganesh-10", name: "Dharti Natural Finish Ganesh — 10 inch", brand: "Prakriti Earth", category: "natural-finish",
    price: 999, compareAtPrice: 1249, rating: 4.7, reviews: 72, image: img.offering, colors: ["Raw Clay", "Terracotta"],
    stock: "in-stock", inventory: 39, delivery: "2–4 days", popularity: 83, createdAt: "2026-08-08", tags: ["natural", "10-inch", "earthy", "clay"],
  },
  {
    id: "cat_013", slug: "sukhkarta-home-5", name: "Sukhkarta Home Ganesh — 5 inch", brand: "Prakriti Studio", category: "home-murtis",
    price: 449, compareAtPrice: 599, rating: 4.6, reviews: 166, badge: "Value pick", image: img.floral, colors: ["Natural"],
    stock: "in-stock", inventory: 92, delivery: "2–4 days", popularity: 85, createdAt: "2026-08-30", tags: ["5-inch", "home", "compact", "gift"],
  },
  {
    id: "cat_014", slug: "gajanan-festive-16", name: "Gajanan Festive Ganesh — 16 inch", brand: "Prakriti Artisan", category: "premium",
    price: 2899, compareAtPrice: 3499, rating: 4.8, reviews: 89, image: img.festive, colors: ["Festive", "Rose"],
    stock: "in-stock", inventory: 16, delivery: "3–5 days", popularity: 89, createdAt: "2026-08-21", tags: ["16-inch", "premium", "festive", "artisan"],
  },
  {
    id: "cat_015", slug: "samruddhi-seed-ganesh-12", name: "Samruddhi Seed Ganesh — 12 inch", brand: "Prakriti Earth", category: "seed-ganesh",
    price: 1599, compareAtPrice: 1999, rating: 4.8, reviews: 58, badge: "Limited", image: img.workshop, colors: ["Earth", "Green Accent"],
    stock: "low-stock", inventory: 8, delivery: "3–5 days", popularity: 87, createdAt: "2026-08-26", tags: ["seed", "12-inch", "plantable", "eco"],
  },
  {
    id: "cat_016", slug: "sahaj-natural-ganesh-14", name: "Sahaj Natural Ganesh — 14 inch", brand: "Prakriti Earth", category: "natural-finish",
    price: 1799, compareAtPrice: 2199, rating: 4.8, reviews: 47, image: img.offering, colors: ["Raw Clay"],
    stock: "in-stock", inventory: 21, delivery: "3–5 days", popularity: 79, createdAt: "2026-08-13", tags: ["natural", "14-inch", "raw-clay", "minimal"],
  },
  {
    id: "cat_017", slug: "mandal-ganesh-30", name: "Mandal Eco Ganesh — 30 inch", brand: "Prakriti Artisan", category: "bulk-orders",
    price: 7999, compareAtPrice: 8999, rating: 4.9, reviews: 24, badge: "Society pick", image: img.garland, colors: ["Custom Finish"],
    stock: "low-stock", inventory: 3, delivery: "7–10 days", popularity: 76, createdAt: "2026-08-05", tags: ["30-inch", "society", "bulk", "custom"],
  },
  {
    id: "cat_018", slug: "office-gifting-ganesh-set", name: "Eco Ganesh Gifting Set — Pack of 12", brand: "Prakriti Studio", category: "bulk-orders",
    price: 5999, compareAtPrice: 7199, rating: 4.7, reviews: 35, image: img.clay, colors: ["Natural Clay"],
    stock: "in-stock", inventory: 18, delivery: "5–8 days", popularity: 74, createdAt: "2026-08-28", tags: ["bulk", "gifting", "office", "mini"],
  },
];
