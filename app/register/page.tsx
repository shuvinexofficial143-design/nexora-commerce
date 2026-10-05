import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { customerAuthEnabled } from "@/lib/auth/features";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  if (!customerAuthEnabled()) notFound();
  return <RegisterForm />;
}
