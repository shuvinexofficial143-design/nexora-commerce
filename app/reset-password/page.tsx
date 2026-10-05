import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { publicCustomerAuthEnabled } from "@/lib/config/features";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function Page() {
  if (!publicCustomerAuthEnabled()) {
    redirect("/shop");
  }

  return <ResetPasswordForm />;
}
