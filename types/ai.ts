import type { CatalogProduct } from "@/types/catalog";

export type AiRole = "user" | "assistant";
export type AiMode = "demo" | "groq";

export type AiMessage = {
  id: string;
  role: AiRole;
  content: string;
  products?: CatalogProduct[];
  createdAt: string;
};

export type AiShoppingIntent = {
  category?: string;
  budget?: number;
  brands: string[];
  features: string[];
  sortBy: "relevance" | "price" | "rating";
};

export type AiAssistantResponse = {
  answer: string;
  products: CatalogProduct[];
  intent: AiShoppingIntent;
  followUps: string[];
  mode: AiMode;
};

export type AiComparisonRow = {
  label: string;
  values: string[];
  winner?: number;
};
