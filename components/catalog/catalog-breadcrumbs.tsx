import Link from "next/link";

export function CatalogBreadcrumbs() {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-5 text-xs font-bold text-black/45">
      <Link href="/" className="transition hover:text-black">Home</Link>
      <span aria-hidden="true">/</span>
      <span className="text-black">Shop</span>
    </nav>
  );
}
