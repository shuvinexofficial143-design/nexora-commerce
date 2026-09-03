import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

export const metadata: Metadata = {
  title: "Secure Checkout | Prakriti Ganesh",
  description: "Secure checkout for eco-friendly Ganesh murtis with protected delivery and flexible payment options.",
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
