"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminTopbar() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const date = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/admin-app/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f5f5f1]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3">
        <div className="hidden flex-1 sm:block">
          <p className="text-xs font-black uppercase tracking-[.15em] text-black/40">{date}</p>
          <p className="text-sm font-bold">Private store control panel</p>
        </div>
        <div className="flex-1 sm:hidden">
          <p className="text-sm font-black">Owner Admin</p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={busy}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-black transition hover:bg-black hover:text-white disabled:opacity-50"
        >
          {busy ? "Signing out…" : "Sign out"}
        </button>
        <div className="grid h-11 w-11 place-items-center rounded-full bg-black text-xs font-black text-white">
          OW
        </div>
      </div>
    </header>
  );
}
