export function ProductRating({ rating, reviews }: { rating: number; reviews: number }) {
  return <a href="#reviews" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-black hover:border-black/25"><span className="text-base">★</span><span>{rating.toFixed(1)}</span><span className="text-black/35">·</span><span className="text-black/55">{reviews.toLocaleString("en-IN")} reviews</span></a>;
}
