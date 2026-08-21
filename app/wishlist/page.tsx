import type { Metadata } from "next";
import { WishlistPageClient } from "@/components/wishlist/wishlist-page-client";

export const metadata: Metadata = { title: "Wishlist", description: "Your saved NEXORA products in one place." };
export default function WishlistPage() { return <WishlistPageClient />; }
