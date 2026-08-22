import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogProducts } from "@/lib/catalog-data";
import { getBundleProducts, getProductDetail, getRelatedProducts } from "@/lib/product-detail-data";
import { ProductBreadcrumbs } from "@/components/product/product-breadcrumbs";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { ProductHighlights } from "@/components/product/product-highlights";
import { ProductSpecifications } from "@/components/product/product-specifications";
import { ProductServiceStrip } from "@/components/product/product-service-strip";
import { ProductReviewsPreview } from "@/components/product/product-reviews-preview";
import { FrequentlyBoughtTogether } from "@/components/product/frequently-bought-together";
import { RelatedProducts } from "@/components/product/related-products";
import { ProductStickyBuybar } from "@/components/product/product-sticky-buybar";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return catalogProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductDetail(slug);
  return product
    ? { title: `${product.name} | NEXORA`, description: product.subtitle }
    : { title: "Product not found | NEXORA" };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductDetail(slug);
  if (!product) {
    notFound();
    return null;
  }

  const related = getRelatedProducts(product, 4);
  const companions = getBundleProducts(product);

  return (
    <main className="pb-24 lg:pb-16">
      <ProductBreadcrumbs product={product} />

      <section className="mx-auto grid max-w-7xl gap-3 px-4 pb-8 sm:gap-8 sm:px-6 sm:pb-14 lg:grid-cols-[1.08fr_.92fr] lg:gap-14 lg:px-8">
        <ProductGallery images={product.images} badge={product.badge} />
        <ProductInfo product={product} />
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 sm:space-y-16 sm:px-6 lg:px-8">
        <ProductServiceStrip product={product} />
        <ProductHighlights product={product} />
        <ProductSpecifications product={product} />
        <FrequentlyBoughtTogether product={product} companions={companions} />
        <ProductReviewsPreview product={product} />
        <RelatedProducts products={related} />
      </div>

      <ProductStickyBuybar
        name={product.name}
        price={product.price}
        unavailable={product.stock === "out-of-stock"}
      />
    </main>
  );
}
