import type { ReactNode } from "react";

export function IconCircle({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-lg shadow-sm">
      {children}
    </span>
  );
}
