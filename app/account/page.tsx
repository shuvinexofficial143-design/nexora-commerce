import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account/account-dashboard";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage() {
  return <AccountDashboard />;
}
