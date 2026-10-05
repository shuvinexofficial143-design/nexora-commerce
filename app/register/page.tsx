import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { publicCustomerAuthEnabled } from "@/lib/config/features";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default function Page() {
  if (!publicCustomerAuthEnabled()) {
    redirect("/shop");
  }

  return <RegisterForm />;
}
