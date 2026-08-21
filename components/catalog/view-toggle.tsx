import type { CatalogView } from "@/types/catalog";

type ViewToggleProps = {
  value: CatalogView;
  onChange: (view: CatalogView) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="hidden rounded-full border border-black/10 bg-white p-1 sm:flex" aria-label="Product view">
      <button type="button" aria-pressed={value === "grid"} onClick={() => onChange("grid")} className={`rounded-full px-3 py-1.5 text-xs font-black ${value === "grid" ? "bg-black text-white" : "text-black/45"}`}>Grid</button>
      <button type="button" aria-pressed={value === "list"} onClick={() => onChange("list")} className={`rounded-full px-3 py-1.5 text-xs font-black ${value === "list" ? "bg-black text-white" : "text-black/45"}`}>List</button>
    </div>
  );
}
