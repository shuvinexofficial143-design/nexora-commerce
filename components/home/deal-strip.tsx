import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function DealStrip() {
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="relative overflow-hidden rounded-[30px] bg-[#d7ff47] px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14 lg:py-12">
          <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border-[42px] border-black/5" />
          <div className="relative">
            <p className="text-[11px] font-black uppercase tracking-[0.2em]">Limited-time edit</p>
            <h2 className="mt-2 max-w-3xl text-4xl font-black leading-[0.92] tracking-[-0.055em] sm:text-6xl">
              Prices that make the decision easier.
            </h2>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-black/60">
              Flash-sale engine, stock countdowns and personalized offers will connect to this experience in later batches.
            </p>
          </div>
          <div className="relative mt-7 flex shrink-0 flex-wrap gap-3 lg:mt-0 lg:pl-10">
            <Button href="/deals">View today&apos;s deals</Button>
            <Button href="/premium" variant="outline">Premium picks</Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
