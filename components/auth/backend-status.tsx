"use client";

import { useAuth } from "@/components/auth/auth-provider";

export function BackendStatus() {
  const { backend, backendMessage } = useAuth();

  if (backend === "ready") {
    return (
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900">
        <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
        <span>Real secure account mode is active. Login and orders are stored in PostgreSQL.</span>
      </div>
    );
  }

  if (backend === "checking") {
    return (
      <div className="mb-5 rounded-2xl border border-black/10 bg-black/[.03] px-4 py-3 text-xs font-bold text-black/50">
        Checking secure backend…
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
      <strong>Backend setup required.</strong> {backendMessage}
    </div>
  );
}
