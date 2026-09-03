import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "Your Cart | Prakriti Ganesh",
  description: "Review your selected eco-friendly Ganesh murtis, festival savings and protected delivery options.",
};

export default function CartPage() {
  return <CartPageClient />;
}
