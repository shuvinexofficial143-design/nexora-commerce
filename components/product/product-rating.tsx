export function ProductRating({ rating, reviews }: { rating: number; reviews: number }) {
  if (!reviews || rating <= 0) {
    return <span className="inline-flex items-center gap-2 rounded-full border border-[#1f3a2e]/10 bg-[#f4f0e7] px-3 py-1.5 text-xs font-black text-[#1f3a2e]">New festival product</span>;
  }
  return <a href="#reviews" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-black hover:border-black/25"><span className="text-base">★</span><span>{rating.toFixed(1)}</span><span className="text-black/35">·</span><span className="text-black/55">{reviews.toLocaleString("en-IN")} reviews</span></a>;
}
