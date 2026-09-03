import type { Metadata } from "next";
import { WishlistPageClient } from "@/components/wishlist/wishlist-page-client";

export const metadata: Metadata = {
  title: "Saved Murtis | Prakriti Ganesh",
  description: "Keep your favourite eco-friendly Ganesh murtis together before choosing the right one.",
};

export default function WishlistPage() {
  return <WishlistPageClient />;
}
