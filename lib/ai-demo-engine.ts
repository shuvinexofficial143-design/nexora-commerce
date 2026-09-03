import { catalogProducts } from "@/lib/catalog-data";
import type { CatalogProduct } from "@/types/catalog";
import type { AiAssistantResponse, AiShoppingIntent } from "@/types/ai";

const categoryLabels: Record<string, string> = {
  "shadu-mati": "Shadu Mati murtis",
  "home-murtis": "home Ganesh murtis",
  "seed-ganesh": "Seed Ganesh murtis",
  premium: "premium artisan murtis",
  "natural-finish": "natural finish murtis",
  "bulk-orders": "society and bulk murtis",
};

const categoryKeywords: Record<string, string[]> = {
  "shadu-mati": ["shadu", "shaadu", "mati", "clay", "traditional", "visarjan"],
  "home-murtis": ["home", "ghar", "small", "mini", "compact", "gifting", "gift"],
  "seed-ganesh": ["seed", "plantable", "plant", "vriksha", "ankur"],
  premium: ["premium", "artisan", "handmade", "hand-finished", "large", "festival"],
  "natural-finish": ["natural", "raw clay", "terracotta", "earthy", "minimal"],
  "bulk-orders": ["bulk", "society", "mandal", "office", "corporate", "community", "30 inch", "24 inch"],
};

function extractBudget(input: string) {
  const cleaned = input.replace(/,/g, "");
  const match = cleaned.match(/(?:₹|rs\.?|inr)?\s*(\d{3,6})/i);
  return match ? Number(match[1]) : undefined;
}

function detectCategory(input: string) {
  const q = input.toLowerCase();
  return Object.entries(categoryKeywords).find(([, words]) => words.some((word) => q.includes(word)))?.[0];
}

function scoreProduct(product: CatalogProduct, query: string, intent: AiShoppingIntent) {
  const q = query.toLowerCase();
  let score = product.popularity / 20 + product.rating;
  if (intent.category === product.category) score += 8;
  if (q.includes(product.brand.toLowerCase())) score += 5;
  for (const tag of product.tags) if (q.includes(tag.toLowerCase())) score += 3;
  for (const word of product.name.toLowerCase().split(/\s+/)) if (word.length > 3 && q.includes(word)) score += 1.5;
  if (intent.budget && product.price <= intent.budget) score += 5;
  if (intent.budget && product.price > intent.budget) score -= Math.min(10, (product.price - intent.budget) / 1000);
  if (product.stock === "out-of-stock") score -= 20;
  return score;
}

export function inferShoppingIntent(query: string): AiShoppingIntent {
  const q = query.toLowerCase();
  const category = detectCategory(query);
  const budget = extractBudget(query);
  const brands = [...new Set(catalogProducts.filter((p) => q.includes(p.brand.toLowerCase())).map((p) => p.brand))];
  const features = [
    "shadu",
    "seed",
    "plantable",
    "natural",
    "premium",
    "artisan",
    "eco-friendly",
    "bulk",
    "society",
    "gift",
    "mini",
  ].filter((feature) => q.includes(feature));
  const sortBy = q.includes("cheap") || q.includes("sasta") || q.includes("lowest")
    ? "price"
    : q.includes("rating") || q.includes("best") || q.includes("top")
      ? "rating"
      : "relevance";
  return { category, budget, brands, features, sortBy };
}

export function runDemoAssistant(query: string): AiAssistantResponse {
  const intent = inferShoppingIntent(query);
  let ranked = catalogProducts
    .map((product) => ({ product, score: scoreProduct(product, query, intent) }))
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);

  if (intent.budget) {
    const withinBudget = ranked.filter((product) => product.price <= intent.budget! && product.stock !== "out-of-stock");
    if (withinBudget.length >= 2) ranked = withinBudget;
  }

  const products = ranked.slice(0, 4);
  const categoryLabel = intent.category ? categoryLabels[intent.category] ?? "Ganesh murtis" : "Ganesh collection";
  const budgetText = intent.budget ? ` ₹${intent.budget.toLocaleString("en-IN")} ke budget me` : "";
  const top = products[0];
  const answer = top
    ? `Maine ${categoryLabel} me${budgetText} best matches nikale hain. ${top.name} strong pick hai: ${top.rating}/5 rating, ₹${top.price.toLocaleString("en-IN")} price aur ${top.delivery.toLowerCase()} delivery. Material, size aur visarjan preference ke hisaab se neeche alternatives bhi dekh sakte ho.`
    : "Is preference ke liye exact murti nahi mili. Budget, size ya material thoda broad karke dobara try karo.";

  return {
    answer,
    products,
    intent,
    followUps: ["Ghar ke liye best size kaunsa hai?", "Top 3 Shadu murtis compare karo", "Sirf in-stock eco options dikhao"],
    mode: "demo",
  };
}
