import { Container } from "@/components/ui/container";

export function AppDownloadBanner() {
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="grid overflow-hidden rounded-[34px] bg-[#d7ff47] lg:grid-cols-[1.25fr_.75fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/45">Shopping, pocket-sized</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.05em] sm:text-5xl">The Nexora app experience is already planned in.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-black/60">Saved carts, instant alerts, faster checkout and personalized drops will work naturally across web and mobile.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <span className="rounded-2xl bg-black px-5 py-3 text-sm font-black text-white"> App Store · Soon</span>
              <span className="rounded-2xl bg-black px-5 py-3 text-sm font-black text-white">▶ Google Play · Soon</span>
            </div>
          </div>
          <div className="soft-grid grid min-h-64 place-items-center border-t border-black/10 p-8 lg:border-l lg:border-t-0">
            <div className="float-card w-48 rounded-[38px] border-[8px] border-black bg-white p-4 shadow-[0_30px_60px_rgba(0,0,0,.2)]">
              <div className="h-3 w-16 rounded-full bg-black/10" />
              <div className="mt-5 aspect-square rounded-3xl bg-[#171714] p-4 text-white">
                <span className="text-3xl font-black">N.</span>
                <p className="mt-12 text-xs font-bold text-white/55">Your cart, offers and orders—together.</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
