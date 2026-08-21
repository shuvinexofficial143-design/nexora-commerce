"use client";

import { useAuth } from "@/components/auth/auth-provider";

export function SignOutButton() {
  const { signOut } = useAuth();
  return <button onClick={signOut} className="w-full rounded-2xl px-4 py-3 text-left text-sm font-black text-red-700 transition hover:bg-red-50">Sign out</button>;
}
