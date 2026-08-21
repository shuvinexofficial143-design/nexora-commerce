import { CATALOG_PRICE_MAX, CATALOG_PRICE_MIN } from "@/lib/catalog-filter";
import type { CatalogFilters } from "@/types/catalog";

type ActiveFiltersProps = {
  filters: CatalogFilters;
  onChange: (filters: CatalogFilters) => void;
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function ActiveFilters({ filters, onChange }: ActiveFiltersProps) {
  const chips: Array<{ key: string; label: string; remove: () => void }> = [];

  filters.categories.forEach((value) => chips.push({
    key: `cat-${value}`,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    remove: () => onChange({ ...filters, categories: filters.categories.filter((item) => item !== value) }),
  }));
  filters.brands.forEach((value) => chips.push({
    key: `brand-${value}`,
    label: value,
    remove: () => onChange({ ...filters, brands: filters.brands.filter((item) => item !== value) }),
  }));
  if (filters.minPrice !== CATALOG_PRICE_MIN || filters.maxPrice !== CATALOG_PRICE_MAX) chips.push({
    key: "price", label: `${money.format(filters.minPrice)} – ${money.format(filters.maxPrice)}`,
    remove: () => onChange({ ...filters, minPrice: CATALOG_PRICE_MIN, maxPrice: CATALOG_PRICE_MAX }),
  });
  if (filters.minRating > 0) chips.push({ key: "rating", label: `★ ${filters.minRating}+`, remove: () => onChange({ ...filters, minRating: 0 }) });
  if (filters.stock !== "all") chips.push({ key: "stock", label: filters.stock.replaceAll("-", " "), remove: () => onChange({ ...filters, stock: "all" }) });
  if (filters.minDiscount > 0) chips.push({ key: "discount", label: `${filters.minDiscount}%+ off`, remove: () => onChange({ ...filters, minDiscount: 0 }) });

  if (!chips.length) return null;

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button key={chip.key} type="button" onClick={chip.remove} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold text-black/65 shadow-sm transition hover:border-black/25 hover:text-black">
          {chip.label} <span className="ml-1 text-black/35">×</span>
        </button>
      ))}
    </div>
  );
}
