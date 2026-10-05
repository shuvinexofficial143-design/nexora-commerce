import { redirect } from "next/navigation";
import { publicCustomerAuthEnabled } from "@/lib/config/features";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!publicCustomerAuthEnabled()) {
    redirect("/track-order");
  }

  return children;
}
