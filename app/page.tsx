import Link from "next/link";
import { HeroSection } from "@/components/home/hero-section";
import { CategoryStrip } from "@/components/home/category-strip";
import { NewArrivalsSection } from "@/components/home/new-arrivals-section";
import { Container } from "@/components/ui/container";

const trustPoints = [
  { title: "Cash on Delivery", text: "COD is available on every murti in the current collection." },
  { title: "Secure Payments", text: "UPI and credit / debit card options remain available at checkout." },
  { title: "Careful Packing", text: "Festival orders are packed with extra care for safer delivery." },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-[#7b431e]/10 bg-[linear-gradient(110deg,#7b2f15_0%,#c86b22_38%,#edb747_72%,#275c42_100%)] text-white">
        <Container className="py-4 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#fff2bf]">Ganesh Chaturthi Special Offer</p>
              <h2 className="mt-1 text-xl font-black tracking-[-.035em] sm:text-2xl">🙏 Bring Bappa Home · Cash on Delivery on All Murtis</h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-white/85 sm:text-xs">
                <span>✓ COD Available</span><span>✓ UPI & Card</span><span>✓ Festival Stock</span><span>✓ Careful Packing</span>
              </div>
            </div>
            <Link href="/shop" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-[#6f351b] shadow-lg transition hover:-translate-y-0.5">Shop Ganesh Murtis →</Link>
          </div>
        </Container>
      </section>

      <HeroSection />
      <CategoryStrip />
      <NewArrivalsSection />

      <section className="py-8 sm:py-16">
        <Container>
          <div className="overflow-hidden rounded-[30px] bg-[#f4ead7] p-5 sm:rounded-[40px] sm:p-10 lg:p-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a54f2a]">Why Prakriti Ganesh</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-[-0.05em] text-[#1f3a2e] sm:text-5xl">Simple ordering for your Ganesh Chaturthi celebration.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#1f3a2e]/65 sm:text-base">Choose your favourite murti, tap Buy Now, fill the delivery details and select Cash on Delivery or a secure online payment option.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {trustPoints.map((point,index)=><div key={point.title} className="rounded-[24px] bg-[#fffaf0] p-5 shadow-sm"><p className="text-xs font-black text-[#a54f2a]">0{index+1}</p><h3 className="mt-5 text-lg font-black text-[#1f3a2e]">{point.title}</h3><p className="mt-2 text-sm leading-5 text-[#1f3a2e]/60">{point.text}</p></div>)}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-8 sm:py-16">
        <Container>
          <div className="relative overflow-hidden rounded-[30px] bg-[#1f3a2e] px-5 py-10 text-white sm:rounded-[40px] sm:px-10 sm:py-14 lg:px-14">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#f6c453]/15 blur-3xl" />
            <div className="relative max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f6c453]">Festival ordering</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">See a murti you love? Buy it directly.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">The store is designed around single-murti orders, so Buy Now takes you straight to checkout without unnecessary cart steps.</p>
              <Link href="/shop" className="mt-6 inline-flex rounded-full bg-[#f6c453] px-5 py-3 text-sm font-black text-[#1f3a2e]">View all 16 murtis</Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
