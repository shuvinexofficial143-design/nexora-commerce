import type { ProductDetail } from "@/types/product-detail";
import { ProductSectionTitle } from "@/components/product/product-section-title";
import { ProductReviewsSummary } from "@/components/product/product-reviews-summary";
import { ReviewCard } from "@/components/product/review-card";

export function ProductReviewsPreview({ product }: { product: ProductDetail }) {
  if (product.source === "database") {
    return (
      <section id="reviews" className="scroll-mt-24 rounded-[24px] border border-black/10 bg-white p-6">
        <h2 className="text-xl font-black">Ratings & reviews</h2>
        <p className="mt-2 text-sm text-black/55">
          {product.reviews > 0
            ? `${product.reviews.toLocaleString("en-IN")} ratings recorded. Written verified reviews are not available yet.`
            : "No verified customer reviews are available for this product yet."}
        </p>
      </section>
    );
  }
  return (
    <section id="reviews" className="scroll-mt-24">
      <ProductSectionTitle eyebrow="Customer voice" title="Ratings & reviews" description="Preview-only sample feedback." />
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <ProductReviewsSummary product={product} />
        <div className="grid gap-3">
          {product.reviewsList.map((row) => <ReviewCard key={row.id} review={row} />)}
        </div>
      </div>
    </section>
  );
}
