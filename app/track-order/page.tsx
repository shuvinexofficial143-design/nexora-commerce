import type { Metadata } from "next";
import { TrackOrderClient } from "@/components/orders/track-order-client";

export const metadata: Metadata = {
  title: "Track Order",
  description: "Track a Nexora guest order using the order number and checkout email.",
  robots: { index: false, follow: false },
};

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
