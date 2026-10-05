import type { Metadata } from "next";
import { PersonalAdminApp } from "@/components/admin/personal-admin-app";

export const metadata: Metadata = {
  title: "Owner Admin · NEXORA",
  robots: { index: false, follow: false },
};

export default function OwnerAdminPage() {
  return <PersonalAdminApp />;
}
