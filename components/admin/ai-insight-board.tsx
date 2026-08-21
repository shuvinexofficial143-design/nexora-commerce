const insights=[
  {tag:"Demand",title:"Fitness demand is accelerating",text:"Yoga mats and adjustable dumbbells are showing the strongest simulated demand signal this week.",action:"Review inventory"},
  {tag:"Conversion",title:"Electronics has checkout friction",text:"High product views but a softer cart-to-order ratio suggests delivery or price reassurance can improve conversion.",action:"Open analytics"},
  {tag:"Retention",title:"Beauty buyers are repeat-ready",text:"Serum and cleanser customers form a strong replenishment cohort for a 30-day reminder campaign.",action:"Create campaign"},
  {tag:"Risk",title:"Two SKUs need attention",text:"Low stock combined with high popularity creates avoidable lost-sales risk on selected products.",action:"View stock alerts"},
];
export function AiInsightBoard(){return <div className="grid gap-4 md:grid-cols-2">{insights.map((item)=><article key={item.title} className="rounded-[28px] border border-black/10 bg-white p-6"><span className="rounded-full bg-[#d7ff47] px-3 py-1 text-[10px] font-black uppercase">AI · {item.tag}</span><h3 className="mt-4 text-xl font-black">{item.title}</h3><p className="mt-2 text-sm leading-6 text-black/55">{item.text}</p><button className="mt-5 rounded-full border border-black/15 px-4 py-2 text-xs font-black">{item.action} →</button></article>)}</div>}
