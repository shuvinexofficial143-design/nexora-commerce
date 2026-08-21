import Link from "next/link";
import { Container } from "@/components/ui/container";

export function MemberBanner() {
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <div className="soft-grid relative overflow-hidden rounded-[34px] bg-[#ffefe1] p-7 sm:p-10 lg:flex lg:items-center lg:justify-between lg:p-12">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Nexora Plus</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">More value for people who shop often.</h2>
            <p className="mt-4 text-sm leading-6 text-black/55">Member pricing, priority support, early access drops and shipping perks—membership infrastructure arrives in a later batch.</p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3 lg:mt-0 lg:pl-8">
            <Link href="/membership" className="rounded-full bg-black px-6 py-3.5 text-sm font-black text-white">Explore membership</Link>
            <Link href="/account/register" className="rounded-full border border-black/15 bg-white/70 px-6 py-3.5 text-sm font-black">Create account</Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
