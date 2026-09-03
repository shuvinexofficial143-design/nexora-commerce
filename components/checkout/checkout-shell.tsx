import Link from "next/link";

export function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(244,234,215,.9),transparent_30rem)] py-8 sm:py-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#a54f2a]">Prakriti Ganesh secure checkout</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-.05em] text-[#1f3a2e] sm:text-5xl">Bring Bappa home.</h1>
            <p className="mt-2 text-sm font-semibold text-black/45">Confirm delivery details, payment and your selected eco-friendly murti.</p>
          </div>
          <Link href="/cart" className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black hover:border-black/25">← Back to cart</Link>
        </div>
        {children}
      </div>
    </section>
  );
}
