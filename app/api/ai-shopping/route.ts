import { NextResponse } from "next/server";
import { runCatalogAssistant, runDemoAssistant } from "@/lib/ai-demo-engine";
import { mapBackendProductToCatalog } from "@/lib/catalog-backend";
import { listProducts } from "@/lib/db/products";

export const runtime = "nodejs";

async function buildCatalogFallback(message: string) {
  try {
    const result = await listProducts({ limit: 100 });
    return runCatalogAssistant(message, result.items.map(mapBackendProductToCatalog), "catalog");
  } catch (error) {
    console.warn("NEXORA AI live catalog unavailable; using bundled demo catalog.", error);
    return runDemoAssistant(message);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { message?: string };
  const message = body.message?.trim();
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const fallback = await buildCatalogFallback(message);
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  if (!apiKey || !model) return NextResponse.json(fallback);

  try {
    const context = fallback.products.map((product) => ({
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      rating: product.rating,
      reviews: product.reviews,
      stock: product.stock,
      inventory: product.inventory,
      delivery: product.delivery,
      tags: product.tags,
    }));
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 320,
        messages: [
          { role: "system", content: "You are NEXORA's concise shopping assistant. Use only the supplied live catalog context. Reply in friendly Hinglish. Never invent products, prices, ratings, reviews, delivery promises or stock." },
          { role: "user", content: `Customer request: ${message}\nCatalog context: ${JSON.stringify(context)}` },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Groq request failed: ${response.status}`);
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = data.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ ...fallback, answer: answer || fallback.answer, mode: "groq" });
  } catch (error) {
    console.warn("NEXORA Groq request failed; returning deterministic catalog ranking.", error);
    return NextResponse.json(fallback);
  }
}
