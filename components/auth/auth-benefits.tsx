const benefits = [
  ["Faster checkout", "Saved addresses, preferences and a ready cart."],
  ["Smart order hub", "Track delivery, returns and refunds in one place."],
  ["Member rewards", "Loyalty, price alerts and personalised offers."],
  ["Privacy controls", "Session and security controls built into your account."],
];

export function AuthBenefits() {
  return <aside className="relative hidden overflow-hidden bg-[#171714] p-12 text-white lg:block"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d7ff47]/20 blur-3xl" /><p className="text-xs font-black uppercase tracking-[.22em] text-[#d7ff47]">Nexora membership</p><h2 className="mt-5 max-w-md text-5xl font-black tracking-[-0.06em]">Your shopping, remembered beautifully.</h2><p className="mt-5 max-w-md text-sm leading-7 text-white/55">A premium account layer designed for shopping history, rewards and frictionless service.</p><div className="mt-12 space-y-4">{benefits.map(([title, text], index) => <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7ff47] text-xs font-black text-black">0{index + 1}</span><div><p className="font-black">{title}</p><p className="mt-1 text-xs leading-5 text-white/50">{text}</p></div></div>)}</div></aside>;
}
