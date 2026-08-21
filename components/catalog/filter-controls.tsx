import { CheckboxFilter } from "./checkbox-filter";
import { DiscountFilter } from "./discount-filter";
import { PriceRangeFilter } from "./price-range-filter";
import { RatingFilter } from "./rating-filter";
import { StockFilter } from "./stock-filter";
import { CATALOG_PRICE_MAX, CATALOG_PRICE_MIN } from "@/lib/catalog-filter";
import type { CatalogFilters, FilterOption } from "@/types/catalog";

type FilterControlsProps = {
  filters: CatalogFilters;
  categories: FilterOption[];
  brands: FilterOption[];
  onChange: (filters: CatalogFilters) => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-black/8 py-5 last:border-b-0">
      <h3 className="mb-4 text-sm font-black">{title}</h3>
      {children}
    </section>
  );
}

export function FilterControls({ filters, categories, brands, onChange }: FilterControlsProps) {
  const toggle = (key: "categories" | "brands", value: string) => {
    const current = filters[key];
    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    });
  };

  return (
    <div>
      <Section title="Category">
        <CheckboxFilter options={categories} selected={filters.categories} onToggle={(value) => toggle("categories", value)} />
      </Section>
      <Section title="Brand">
        <CheckboxFilter options={brands} selected={filters.brands} onToggle={(value) => toggle("brands", value)} />
      </Section>
      <Section title="Price">
        <PriceRangeFilter
          min={filters.minPrice}
          max={filters.maxPrice}
          floor={CATALOG_PRICE_MIN}
          ceiling={CATALOG_PRICE_MAX}
          onChange={(minPrice, maxPrice) => onChange({ ...filters, minPrice, maxPrice })}
        />
      </Section>
      <Section title="Customer rating">
        <RatingFilter value={filters.minRating} onChange={(minRating) => onChange({ ...filters, minRating })} />
      </Section>
      <Section title="Availability">
        <StockFilter value={filters.stock} onChange={(stock) => onChange({ ...filters, stock })} />
      </Section>
      <Section title="Discount">
        <DiscountFilter value={filters.minDiscount} onChange={(minDiscount) => onChange({ ...filters, minDiscount })} />
      </Section>
    </div>
  );
}
