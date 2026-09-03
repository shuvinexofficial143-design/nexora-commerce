const benefits = [
  ["Faster festive checkout", "Save your address and keep your chosen murti ready in cart."],
  ["Order tracking", "Follow your Ganesh order and delivery status from one place."],
  ["Wishlist your Bappa", "Shortlist sizes and styles before you make the final choice."],
  ["Secure account", "Keep order history and account preferences protected."],
];

export function AuthBenefits() {
  return <aside className="relative hidden overflow-hidden bg-[#1f3a2e] p-12 text-white lg:block"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#f6c453]/18 blur-3xl" /><p className="text-xs font-black uppercase tracking-[.22em] text-[#f6c453]">Prakriti Ganesh account</p><h2 className="mt-5 max-w-md text-5xl font-black tracking-[-0.06em]">Plan your celebration with less rush.</h2><p className="mt-5 max-w-md text-sm leading-7 text-white/60">Save your favourites, checkout faster and keep festival orders organised in one account.</p><div className="mt-12 space-y-4">{benefits.map(([title, text], index) => <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6c453] text-xs font-black text-[#1f3a2e]">0{index + 1}</span><div><p className="font-black">{title}</p><p className="mt-1 text-xs leading-5 text-white/55">{text}</p></div></div>)}</div></aside>;
}
