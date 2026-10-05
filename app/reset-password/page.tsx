import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { customerAuthEnabled } from "@/lib/auth/features";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  if (!customerAuthEnabled()) notFound();
  return <ResetPasswordForm />;
}
