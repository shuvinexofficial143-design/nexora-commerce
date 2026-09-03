import type { Metadata } from "next";
import { AiShopShell } from "@/components/ai/ai-shop-shell";

export const metadata: Metadata = {
  title: "Ganesh Murti Assistant | Prakriti Ganesh",
  description: "Get size, budget, material and eco-friendly Ganesh murti recommendations from the Prakriti Ganesh catalog.",
};

export default function AiAssistantPage() {
  return <AiShopShell />;
}
