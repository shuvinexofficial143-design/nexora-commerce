import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { customerAuthEnabled } from "@/lib/auth/features";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  if (!customerAuthEnabled()) notFound();
  return <ForgotPasswordForm />;
}
