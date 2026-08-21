import type { ProductDetail } from "@/types/product-detail";
import { ProductSectionTitle } from "@/components/product/product-section-title";
import { ProductReviewsSummary } from "@/components/product/product-reviews-summary";
import { ReviewCard } from "@/components/product/review-card";
export function ProductReviewsPreview({ product }: { product: ProductDetail }) {
  return <section id="reviews" className="scroll-mt-24"><ProductSectionTitle eyebrow="Customer voice" title="Ratings & reviews" description="Verified feedback from recent shoppers." /><div className="grid gap-5 lg:grid-cols-[320px_1fr]"><ProductReviewsSummary product={product} /><div className="grid gap-3">{product.reviewsList.map((review) => <ReviewCard key={review.id} review={review} />)}<button type="button" className="rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-black hover:border-black/35">Read all reviews</button></div></div></section>;
}
