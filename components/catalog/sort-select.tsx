import type { SortOption } from "@/types/catalog";

type SortSelectProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold sm:text-sm">
      <span className="hidden text-black/40 sm:inline">Sort</span>
      <select value={value} onChange={(event) => onChange(event.target.value as SortOption)} className="bg-transparent font-black outline-none">
        <option value="featured">Featured</option>
        <option value="newest">Newest</option>
        <option value="rating">Top rated</option>
        <option value="price-low">Price: low to high</option>
        <option value="price-high">Price: high to low</option>
        <option value="discount">Biggest discount</option>
      </select>
    </label>
  );
}
