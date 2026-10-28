import { listProducts, listPublicCatalogFacets, listPublicAttributeFacets } from "@/lib/db/products";
import { toProductListQuery, type LiveCatalogQuery } from "@/lib/storefront/catalog-query";

export async function loadLiveCatalog(query: LiveCatalogQuery) {
  const input = toProductListQuery(query);
  let listing = await listProducts(input);
  // Manually entered / stale page links should resolve to the final real page,
  // not falsely report that a populated catalog has zero matches.
  if (listing.total > 0 && listing.offset >= listing.total) {
    const finalPage = Math.max(1, Math.ceil(listing.total / listing.limit));
    listing = await listProducts({ ...input, offset: (finalPage - 1) * listing.limit });
  }
  const [facets,attributes] = await Promise.all([listPublicCatalogFacets(),listPublicAttributeFacets()]);
  return { ...listing, facets:{...facets,attributes} };
}
