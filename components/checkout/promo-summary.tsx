export function PromoSummary({ coupon }: { coupon: string }) {
  if (!coupon) return <div className="rounded-2xl border border-dashed border-black/15 p-3 text-xs font-bold text-black/40">No promo applied. You can return to the bag to add a coupon.</div>;
  return <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-3"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-700/60">Promo active</p><p className="mt-1 text-sm font-black text-emerald-800">{coupon}</p></div><span className="text-lg">✓</span></div>;
}
