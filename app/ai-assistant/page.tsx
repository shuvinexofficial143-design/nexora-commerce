import type { Metadata } from "next";
import { AiShopShell } from "@/components/ai/ai-shop-shell";
export const metadata:Metadata={title:"AI Shopping Assistant | NEXORA",description:"Natural-language AI product discovery, recommendations and comparison for the NEXORA catalog."};
export default function AiAssistantPage(){return <AiShopShell/>}
