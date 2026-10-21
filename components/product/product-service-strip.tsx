import type { ProductDetail } from "@/types/product-detail";
export function ProductServiceStrip({ product }: { product: ProductDetail }) {
  const items: Array<{ icon: string; title: string; text: string }> = product.source === "database"
    ? [
        { icon: "↺", title: "Return policy", text: product.returnPolicy },
        { icon: "◇", title: "Warranty information", text: product.warranty },
        { icon: "✓", title: "Store", text: product.seller },
      ]
    : [
        { icon: "↺", title: "Easy returns", text: product.returnPolicy },
        { icon: "◇", title: "Quality cover", text: product.warranty },
        { icon: "✓", title: "Trusted seller", text: product.seller },
      ];
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {items.map(({ icon, title, text }) => (
        <div key={title} className="rounded-[24px] border border-black/8 bg-white p-5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d7ff47] text-lg font-black">{icon}</span>
          <p className="mt-4 text-sm font-black">{title}</p>
          <p className="mt-1 text-xs leading-5 text-black/50">{text}</p>
        </div>
      ))}
    </section>
  );
}
