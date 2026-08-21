import { ResultsSummary } from "./results-summary";
import { SortSelect } from "./sort-select";
import { ViewToggle } from "./view-toggle";
import type { CatalogView, SortOption } from "@/types/catalog";

type CatalogToolbarProps = {
  visible: number;
  total: number;
  activeCount: number;
  sort: SortOption;
  view: CatalogView;
  onOpenFilters: () => void;
  onSortChange: (sort: SortOption) => void;
  onViewChange: (view: CatalogView) => void;
};

export function CatalogToolbar({ visible, total, activeCount, sort, view, onOpenFilters, onSortChange, onViewChange }: CatalogToolbarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_14px_45px_rgba(17,17,15,0.04)]">
      <ResultsSummary visible={visible} total={total} />
      <div className="ml-auto flex items-center gap-2">
        <button type="button" onClick={onOpenFilters} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-black lg:hidden">
          Filters{activeCount ? ` (${activeCount})` : ""}
        </button>
        <SortSelect value={sort} onChange={onSortChange} />
        <ViewToggle value={view} onChange={onViewChange} />
      </div>
    </div>
  );
}
