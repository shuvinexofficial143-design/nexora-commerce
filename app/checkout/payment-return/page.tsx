import type { Metadata } from "next";
import { CashfreeReturn } from "@/components/checkout/cashfree-return";

export const metadata: Metadata = {
  title: "Verify payment",
  robots: { index: false, follow: false },
};

export default async function CashfreeReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const query = await searchParams;
  return <CashfreeReturn orderNumber={query.order_id?.trim() ?? ""} />;
}
