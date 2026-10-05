import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { publicCustomerAuthEnabled } from "@/lib/config/features";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default function Page() {
  if (!publicCustomerAuthEnabled()) {
    redirect("/shop");
  }

  return <ForgotPasswordForm />;
}
