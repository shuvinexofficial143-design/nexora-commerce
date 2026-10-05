"use client";

import { useMemo, useState } from "react";
import { ActiveFilters } from "./active-filters";
import { CatalogToolbar } from "./catalog-toolbar";
import { EmptyState } from "./empty-state";
import { FilterControls } from "./filter-controls";
import { FilterSidebar } from "./filter-sidebar";
import { MobileFilterDrawer } from "./mobile-filter-drawer";
import { Pagination } from "./pagination";
import { ProductGrid } from "./product-grid";
import { buildFilterOptions, countActiveFilters, defaultCatalogFilters, filterCatalogProducts } from "@/lib/catalog-filter";
import type { CatalogFilters, CatalogProduct, CatalogView, SortOption } from "@/types/catalog";

const PAGE_SIZE = 12;

export function CatalogShell({
  products,
  initialCategory,
  initialSort,
}: {
  products: CatalogProduct[];
  initialCategory?: string;
  initialSort?: SortOption;
}) {
  const [filters, setFilters] = useState<CatalogFilters>(() => ({
    ...defaultCatalogFilters,
    categories: initialCategory ? [initialCategory] : [],
  }));
  const [sort, setSort] = useState<SortOption>(initialSort ?? "featured");
  const [view, setView] = useState<CatalogView>("grid");
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);

  const categories = useMemo(() => buildFilterOptions(products, "category"), [products]);
  const brands = useMemo(() => buildFilterOptions(products, "brand"), [products]);
  const filtered = useMemo(() => filterCatalogProducts(products, filters, sort), [products, filters, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleProducts = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeCount = countActiveFilters(filters);

  const updateFilters = (next: CatalogFilters) => {
    setFilters(next);
    setPage(1);
  };

  const clearFilters = () => updateFilters(defaultCatalogFilters);

  const controls = (
    <FilterControls filters={filters} categories={categories} brands={brands} onChange={updateFilters} />
  );

  return (
    <section className="mt-7 lg:mt-9">
      <CatalogToolbar
        visible={filtered.length}
        total={products.length}
        activeCount={activeCount}
        sort={sort}
        view={view}
        onOpenFilters={() => setMobileOpen(true)}
        onSortChange={(next) => { setSort(next); setPage(1); }}
        onViewChange={setView}
      />
      <div className="flex items-start gap-6">
        <FilterSidebar activeCount={activeCount} onClear={clearFilters}>{controls}</FilterSidebar>
        <div className="min-w-0 flex-1">
          <ActiveFilters filters={filters} onChange={updateFilters} />
          {visibleProducts.length ? <ProductGrid products={visibleProducts} view={view} /> : <EmptyState onReset={clearFilters} />}
          <Pagination page={safePage} totalPages={totalPages} onChange={(next) => { setPage(next); window.scrollTo({ top: 330, behavior: "smooth" }); }} />
        </div>
      </div>
      <MobileFilterDrawer open={mobileOpen} activeCount={activeCount} onClose={() => setMobileOpen(false)} onClear={clearFilters}>
        {controls}
      </MobileFilterDrawer>
    </section>
  );
}
