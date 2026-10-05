import type { Metadata } from "next";
import { PersonalAdminLogin } from "@/components/admin/personal-admin-login";

export const metadata: Metadata = {
  title: "Owner Admin · NEXORA",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <PersonalAdminLogin />;
}
