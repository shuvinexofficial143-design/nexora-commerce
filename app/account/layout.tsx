import { notFound } from "next/navigation";
import { customerAuthEnabled } from "@/lib/auth/features";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!customerAuthEnabled()) notFound();
  return children;
}
