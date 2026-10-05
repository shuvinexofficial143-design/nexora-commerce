import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "Shopping Bag",
  description: "Review your NEXORA shopping bag, savings and delivery estimate.",
  robots: { index: false, follow: false },
};
export default function CartPage() { return <CartPageClient />; }
