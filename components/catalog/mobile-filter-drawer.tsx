"use client";

import type { ReactNode } from "react";

type MobileFilterDrawerProps = {
  open: boolean;
  children: ReactNode;
  activeCount: number;
  onClose: () => void;
  onClear: () => void;
};

export function MobileFilterDrawer({ open, children, activeCount, onClose, onClear }: MobileFilterDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Product filters">
      <button aria-label="Close filters" type="button" onClick={onClose} className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div className="absolute inset-y-0 right-0 flex w-[min(92vw,390px)] flex-col bg-[#f8f8f6] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 bg-white px-5 py-4">
          <div>
            <p className="text-lg font-black">Filters</p>
            <p className="text-xs font-semibold text-black/40">{activeCount} active</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black text-lg font-black text-white">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">{children}</div>
        <div className="grid grid-cols-2 gap-3 border-t border-black/10 bg-white p-4">
          <button type="button" onClick={onClear} className="rounded-full border border-black/15 px-4 py-3 text-sm font-black">Clear</button>
          <button type="button" onClick={onClose} className="rounded-full bg-black px-4 py-3 text-sm font-black text-white">Show results</button>
        </div>
      </div>
    </div>
  );
}
