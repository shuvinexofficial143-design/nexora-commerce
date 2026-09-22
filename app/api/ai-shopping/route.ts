import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/catalog-backend";
import { runDemoAssistant } from "@/lib/ai-demo-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { message?: string };
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const catalog = await getCatalogProducts();
  const fallback = runDemoAssistant(message, catalog);
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 320,
        messages: [
          {
            role: "system",
            content:
              "You are NEXORA's concise shopping assistant. Use only the supplied live catalog context. Reply in friendly Hinglish. Never invent products, prices, ratings, stock, inventory or delivery details.",
          },
          {
            role: "user",
            content: `Customer request: ${message}\nLive catalog shortlist: ${JSON.stringify(context)}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`Groq request failed: ${response.status}`);
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = data.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({
      ...fallback,
      answer: answer || fallback.answer,
      mode: "groq",
    });
  } catch (error) {
    console.error("NEXORA AI shopping request failed; using catalog fallback.", error);
    return NextResponse.json(fallback);
  }
}
