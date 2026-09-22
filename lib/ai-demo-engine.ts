import { catalogProducts, categoryLabels } from "@/lib/catalog-data";
import type { CatalogProduct } from "@/types/catalog";
import type { AiAssistantResponse, AiMode, AiShoppingIntent } from "@/types/ai";

const categoryKeywords: Record<string, string[]> = {
  electronics: ["electronic", "headphone", "camera", "phone", "keyboard", "speaker", "gadget", "tech", "gaming"],
  fashion: ["fashion", "shirt", "jacket", "clothes", "wear", "outfit"],
  home: ["home", "desk", "lamp", "blanket", "diffuser", "bottle", "decor"],
  beauty: ["beauty", "skin", "serum", "makeup", "cleanser", "face"],
  fitness: ["fitness", "gym", "training", "dumbbell", "yoga", "workout"],
  accessories: ["accessory", "watch", "bag", "backpack", "sunglass", "wallet"],
};

function extractBudget(input: string) {
  const cleaned = input.replace(/,/g, "");
  const match = cleaned.match(/(?:₹|rs\.?|inr)?\s*(\d{3,6})/i);
  return match ? Number(match[1]) : undefined;
}

function detectCategory(input: string, products: CatalogProduct[]) {
  const q = input.toLowerCase();
  const known = Object.entries(categoryKeywords).find(([, words]) => words.some((word) => q.includes(word)))?.[0];
  if (known) return known;

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  return categories.find((category) => q.includes(category.toLowerCase().replace(/-/g, " ")));
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

export function inferShoppingIntent(query: string, products: CatalogProduct[] = catalogProducts): AiShoppingIntent {
  const q = query.toLowerCase();
  const category = detectCategory(query, products);
  const budget = extractBudget(query);
  const brands = [...new Set(products.filter((p) => q.includes(p.brand.toLowerCase())).map((p) => p.brand))];
  const features = ["premium", "wireless", "camera", "travel", "gym", "skin", "minimal", "running", "5g"].filter((feature) => q.includes(feature));
  const sortBy = q.includes("cheap") || q.includes("sasta") || q.includes("lowest") ? "price" : q.includes("rating") || q.includes("best") ? "rating" : "relevance";
  return { category, budget, brands, features, sortBy };
}

export function runCatalogAssistant(
  query: string,
  productsSource: CatalogProduct[],
  mode: AiMode = "catalog",
): AiAssistantResponse {
  const intent = inferShoppingIntent(query, productsSource);
  let ranked = productsSource
    .map((product) => ({ product, score: scoreProduct(product, query, intent) }))
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);

  if (intent.budget) {
    const withinBudget = ranked.filter((product) => product.price <= intent.budget! && product.stock !== "out-of-stock");
    if (withinBudget.length >= 2) ranked = withinBudget;
  }

  const products = ranked.slice(0, 4);
  const categoryLabel = intent.category
    ? categoryLabels[intent.category] ?? intent.category.replace(/(^.|-.)/g, (part) => part.toUpperCase())
    : "store";
  const budgetText = intent.budget ? ` ₹${intent.budget.toLocaleString("en-IN")} ke budget me` : "";
  const top = products[0];
  const answer = top
    ? `Maine ${categoryLabel} se${budgetText} strong matches nikale hain. ${top.name} sabse balanced pick lag raha hai: ${top.rating}/5 rating, ₹${top.price.toLocaleString("en-IN")} price aur ${top.delivery.toLowerCase()} delivery. Neeche alternatives bhi compare kar sakte ho.`
    : "Is request ke liye exact product nahi mila. Budget ya category thoda broad karke dobara try karo.";

  return {
    answer,
    products,
    intent,
    followUps: ["Sabse value-for-money kaunsa hai?", "Top 3 compare karo", "Sirf in-stock options dikhao"],
    mode,
  };
}

export function runDemoAssistant(query: string): AiAssistantResponse {
  return runCatalogAssistant(query, catalogProducts, "demo");
}
