import type { ReactNode } from "react";

type FilterSidebarProps = {
  children: ReactNode;
  activeCount: number;
  onClear: () => void;
};

export function FilterSidebar({ children, activeCount, onClear }: FilterSidebarProps) {
  return (
    <aside className="hidden w-[270px] shrink-0 lg:block">
      <div className="sticky top-40 rounded-[26px] border border-black/10 bg-white p-5 shadow-[0_18px_55px_rgba(17,17,15,0.05)]">
        <div className="flex items-center justify-between border-b border-black/8 pb-4">
          <div>
            <p className="text-lg font-black tracking-tight">Filters</p>
            <p className="mt-0.5 text-xs font-semibold text-black/40">{activeCount} active</p>
          </div>
          <button type="button" onClick={onClear} className="text-xs font-black underline decoration-black/25 underline-offset-4">Clear all</button>
        </div>
        {children}
      </div>
    </aside>
  );
}
