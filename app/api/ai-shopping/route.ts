import { NextResponse } from "next/server";
import { runDemoAssistant } from "@/lib/ai-demo-engine";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { message?: string };
  const message = body.message?.trim();
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const fallback = runDemoAssistant(message);
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  if (!apiKey || !model) return NextResponse.json(fallback);

  try {
    const context = fallback.products.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      rating: product.rating,
      stock: product.stock,
      delivery: product.delivery,
      tags: product.tags,
      finishes: product.colors,
    }));
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 360,
        messages: [
          {
            role: "system",
            content: "You are Prakriti Ganesh's concise shopping assistant for eco-friendly Ganesh murtis. Use only the supplied catalog context. Help with size, budget, Shadu Mati, seed/plantable, natural finish, home, gifting, society and bulk-order choices. Reply in friendly Hinglish. Never invent products, prices, ratings, materials, stock or delivery claims.",
          },
          { role: "user", content: `Customer request: ${message}\nCatalog context: ${JSON.stringify(context)}` },
        ],
      }),
    });
    if (!response.ok) throw new Error(`Groq request failed: ${response.status}`);
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = data.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ ...fallback, answer: answer || fallback.answer, mode: "groq" });
  } catch {
    return NextResponse.json(fallback);
  }
}
