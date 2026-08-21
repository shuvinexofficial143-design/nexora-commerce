const tasks=[
  ["Restock first","Performance Training Shoe","High sales velocity + 12 available units"],
  ["Improve listing","Structured City Backpack","Strong views, weaker conversion than store average"],
  ["Reply priority","Arc Runner Sneakers","New 3-star review needs a seller response"],
  ["Promotion idea","Slim Leather Card Wallet","Good margin makes it suitable for bundle testing"],
];
export function AiSellerCopilot(){return <section className="rounded-[28px] bg-[#121613] p-6 text-white"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#8cff8c]">Seller copilot</p><h2 className="mt-2 text-2xl font-black">Today&apos;s AI action queue</h2><div className="mt-5 space-y-3">{tasks.map(([tag,title,text])=><div key={title} className="rounded-2xl bg-white/8 p-4"><div className="flex items-center justify-between gap-3"><strong>{title}</strong><span className="rounded-full bg-[#8cff8c] px-2 py-1 text-[10px] font-black text-black">{tag}</span></div><p className="mt-2 text-sm text-white/60">{text}</p></div>)}</div></section>}
