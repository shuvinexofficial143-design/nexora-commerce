import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

export const metadata: Metadata = { title: "Checkout", description: "Secure multi-step checkout for Nexora Commerce." };

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
