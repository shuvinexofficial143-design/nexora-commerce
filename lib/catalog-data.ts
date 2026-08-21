import type { CatalogProduct } from "@/types/catalog";

export const catalogProducts: CatalogProduct[] = [
  {
    id: "cat_001", slug: "airwave-max-headphones", name: "Airwave Max Wireless Headphones", brand: "Auralab", category: "electronics",
    price: 7999, compareAtPrice: 10999, rating: 4.8, reviews: 1824, badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85", colors: ["Black", "Sand"],
    stock: "in-stock", inventory: 44, delivery: "Tomorrow", popularity: 98, createdAt: "2026-08-03", tags: ["audio", "wireless", "premium"],
  },
  {
    id: "cat_002", slug: "arc-runner-sneakers", name: "Arc Runner Everyday Sneakers", brand: "Northline", category: "fashion",
    price: 3299, compareAtPrice: 4499, rating: 4.7, reviews: 936, badge: "Trending",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85", colors: ["Red", "White"],
    stock: "in-stock", inventory: 31, delivery: "Tomorrow", popularity: 94, createdAt: "2026-07-18", tags: ["shoes", "running", "casual"],
  },
  {
    id: "cat_003", slug: "minimal-desk-lamp", name: "Minimal Focus Desk Lamp", brand: "Forme", category: "home",
    price: 2199, compareAtPrice: 2999, rating: 4.6, reviews: 487,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85", colors: ["Black", "Ivory"],
    stock: "low-stock", inventory: 6, delivery: "2 days", popularity: 81, createdAt: "2026-06-22", tags: ["desk", "lighting", "workspace"],
  },
  {
    id: "cat_004", slug: "studio-watch-steel", name: "Studio Steel Minimal Watch", brand: "Mori", category: "accessories",
    price: 5499, compareAtPrice: 6999, rating: 4.8, reviews: 731, badge: "Premium",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85", colors: ["Silver", "Graphite"],
    stock: "in-stock", inventory: 19, delivery: "Tomorrow", popularity: 89, createdAt: "2026-08-08", tags: ["watch", "minimal", "steel"],
  },
  {
    id: "cat_005", slug: "essential-skin-set", name: "Essential Daily Skin Set", brand: "Serein", category: "beauty",
    price: 1899, compareAtPrice: 2499, rating: 4.5, reviews: 604,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=85", colors: ["Natural"],
    stock: "in-stock", inventory: 52, delivery: "Tomorrow", popularity: 86, createdAt: "2026-07-29", tags: ["skin", "care", "daily"],
  },
  {
    id: "cat_006", slug: "performance-training-shoe", name: "Performance Training Shoe", brand: "Kinetic", category: "fitness",
    price: 4299, compareAtPrice: 5999, rating: 4.7, reviews: 1208, badge: "Hot pick",
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=85", colors: ["White", "Blue"],
    stock: "in-stock", inventory: 28, delivery: "Tomorrow", popularity: 95, createdAt: "2026-07-31", tags: ["training", "gym", "shoes"],
  },
  {
    id: "cat_007", slug: "pocket-camera-pro", name: "Pocket Creator Camera Pro", brand: "FrameOne", category: "electronics",
    price: 18499, compareAtPrice: 21999, rating: 4.9, reviews: 321, badge: "New",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85", colors: ["Black"],
    stock: "low-stock", inventory: 4, delivery: "2 days", popularity: 92, createdAt: "2026-08-16", tags: ["camera", "creator", "travel"],
  },
  {
    id: "cat_008", slug: "structured-city-backpack", name: "Structured City Backpack", brand: "Fieldwork", category: "accessories",
    price: 2799, compareAtPrice: 3499, rating: 4.6, reviews: 842,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85", colors: ["Olive", "Black"],
    stock: "in-stock", inventory: 37, delivery: "Tomorrow", popularity: 84, createdAt: "2026-06-28", tags: ["bag", "travel", "work"],
  },
  {
    id: "cat_009", slug: "nova-smartphone-5g", name: "Nova X1 5G Smartphone", brand: "Orion", category: "electronics",
    price: 24999, compareAtPrice: 29999, rating: 4.6, reviews: 2140, badge: "Top rated",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85", colors: ["Midnight", "Silver"],
    stock: "in-stock", inventory: 22, delivery: "Tomorrow", popularity: 97, createdAt: "2026-08-10", tags: ["phone", "5g", "camera"],
  },
  {
    id: "cat_010", slug: "quiet-key-mechanical-keyboard", name: "Quiet Key Mechanical Keyboard", brand: "Auralab", category: "electronics",
    price: 4999, compareAtPrice: 6499, rating: 4.7, reviews: 569,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85", colors: ["Graphite", "Cream"],
    stock: "in-stock", inventory: 18, delivery: "2 days", popularity: 88, createdAt: "2026-07-24", tags: ["keyboard", "desk", "gaming"],
  },
  {
    id: "cat_011", slug: "linen-overshirt", name: "Relaxed Linen Overshirt", brand: "Northline", category: "fashion",
    price: 2399, compareAtPrice: 3199, rating: 4.4, reviews: 308,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85", colors: ["Stone", "Sage"],
    stock: "in-stock", inventory: 63, delivery: "Tomorrow", popularity: 76, createdAt: "2026-07-06", tags: ["shirt", "linen", "summer"],
  },
  {
    id: "cat_012", slug: "everyday-sunglasses", name: "Everyday Polarized Sunglasses", brand: "Mori", category: "accessories",
    price: 1599, compareAtPrice: 2399, rating: 4.5, reviews: 992, badge: "Deal",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85", colors: ["Black", "Tortoise"],
    stock: "in-stock", inventory: 47, delivery: "Tomorrow", popularity: 83, createdAt: "2026-07-12", tags: ["eyewear", "polarized", "summer"],
  },
  {
    id: "cat_013", slug: "soft-throw-blanket", name: "Soft Woven Throw Blanket", brand: "Forme", category: "home",
    price: 1699, compareAtPrice: 2199, rating: 4.7, reviews: 415,
    image: "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?auto=format&fit=crop&w=900&q=85", colors: ["Oat", "Charcoal"],
    stock: "in-stock", inventory: 26, delivery: "2 days", popularity: 79, createdAt: "2026-06-14", tags: ["blanket", "decor", "comfort"],
  },
  {
    id: "cat_014", slug: "ceramic-aroma-diffuser", name: "Ceramic Aroma Diffuser", brand: "Forme", category: "home",
    price: 2899, compareAtPrice: 3999, rating: 4.6, reviews: 278,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85", colors: ["White", "Clay"],
    stock: "out-of-stock", inventory: 0, delivery: "Restocking soon", popularity: 73, createdAt: "2026-05-30", tags: ["aroma", "home", "wellness"],
  },
  {
    id: "cat_015", slug: "vitamin-c-serum", name: "Bright C Daily Face Serum", brand: "Serein", category: "beauty",
    price: 1299, compareAtPrice: 1999, rating: 4.8, reviews: 1675, badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85", colors: ["Amber"],
    stock: "in-stock", inventory: 71, delivery: "Tomorrow", popularity: 96, createdAt: "2026-07-26", tags: ["serum", "vitamin-c", "skincare"],
  },
  {
    id: "cat_016", slug: "clean-makeup-brush-set", name: "12-Piece Clean Makeup Brush Set", brand: "Velora", category: "beauty",
    price: 999, compareAtPrice: 1699, rating: 4.3, reviews: 814, badge: "40% off",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=85", colors: ["Rose", "Black"],
    stock: "in-stock", inventory: 84, delivery: "Tomorrow", popularity: 82, createdAt: "2026-06-02", tags: ["makeup", "brush", "beauty"],
  },
  {
    id: "cat_017", slug: "adjustable-dumbbell-set", name: "Compact Adjustable Dumbbell Set", brand: "Kinetic", category: "fitness",
    price: 6499, compareAtPrice: 8999, rating: 4.7, reviews: 509,
    image: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?auto=format&fit=crop&w=900&q=85", colors: ["Black"],
    stock: "low-stock", inventory: 7, delivery: "3 days", popularity: 87, createdAt: "2026-07-04", tags: ["weights", "gym", "strength"],
  },
  {
    id: "cat_018", slug: "smart-fitness-band", name: "Pulse Smart Fitness Band", brand: "Kinetic", category: "fitness",
    price: 2999, compareAtPrice: 4499, rating: 4.4, reviews: 1330,
    image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=900&q=85", colors: ["Black", "Lilac"],
    stock: "in-stock", inventory: 35, delivery: "Tomorrow", popularity: 90, createdAt: "2026-08-01", tags: ["fitness", "tracker", "wearable"],
  },
  {
    id: "cat_019", slug: "wireless-speaker-mini", name: "Mini Room Wireless Speaker", brand: "Auralab", category: "electronics",
    price: 3499, compareAtPrice: 4999, rating: 4.5, reviews: 1107,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85", colors: ["Black", "Sand"],
    stock: "in-stock", inventory: 42, delivery: "Tomorrow", popularity: 91, createdAt: "2026-06-18", tags: ["speaker", "wireless", "audio"],
  },
  {
    id: "cat_020", slug: "classic-canvas-jacket", name: "Classic Canvas Utility Jacket", brand: "Fieldwork", category: "fashion",
    price: 3899, compareAtPrice: 5299, rating: 4.6, reviews: 451,
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85", colors: ["Olive", "Tan"],
    stock: "out-of-stock", inventory: 0, delivery: "Restocking soon", popularity: 78, createdAt: "2026-05-17", tags: ["jacket", "utility", "outerwear"],
  },
  {
    id: "cat_021", slug: "leather-card-wallet", name: "Slim Leather Card Wallet", brand: "Mori", category: "accessories",
    price: 1199, compareAtPrice: 1799, rating: 4.7, reviews: 724,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85", colors: ["Tan", "Black"],
    stock: "in-stock", inventory: 58, delivery: "Tomorrow", popularity: 80, createdAt: "2026-06-25", tags: ["wallet", "leather", "minimal"],
  },
  {
    id: "cat_022", slug: "glass-water-bottle", name: "Everyday Glass Water Bottle", brand: "Forme", category: "home",
    price: 799, compareAtPrice: 1199, rating: 4.4, reviews: 389,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85", colors: ["Clear", "Smoke"],
    stock: "in-stock", inventory: 76, delivery: "Tomorrow", popularity: 72, createdAt: "2026-07-09", tags: ["bottle", "glass", "kitchen"],
  },
  {
    id: "cat_023", slug: "travel-yoga-mat", name: "Grip Travel Yoga Mat", brand: "Kinetic", category: "fitness",
    price: 1999, compareAtPrice: 2999, rating: 4.8, reviews: 652, badge: "Top rated",
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=900&q=85", colors: ["Sage", "Black"],
    stock: "in-stock", inventory: 29, delivery: "2 days", popularity: 85, createdAt: "2026-08-13", tags: ["yoga", "mat", "travel"],
  },
  {
    id: "cat_024", slug: "daily-cleanser-gel", name: "Gentle Daily Cleanser Gel", brand: "Serein", category: "beauty",
    price: 899, compareAtPrice: 1299, rating: 4.6, reviews: 945,
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=85", colors: ["Clear"],
    stock: "low-stock", inventory: 8, delivery: "2 days", popularity: 84, createdAt: "2026-07-21", tags: ["cleanser", "skin", "gentle"],
  },
];

export const categoryLabels: Record<string, string> = {
  electronics: "Electronics",
  fashion: "Fashion",
  home: "Home",
  beauty: "Beauty",
  fitness: "Fitness",
  accessories: "Accessories",
};
