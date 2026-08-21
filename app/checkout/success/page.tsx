import type { Metadata } from "next";
import { OrderSuccess } from "@/components/checkout/order-success";

export const metadata: Metadata = { title: "Order confirmed" };

export default function CheckoutSuccessPage() {
  return <OrderSuccess />;
}
