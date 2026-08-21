import { Container } from "@/components/ui/container";

export function NewsletterSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/40">Inbox, but useful</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">Drops, price cuts and good finds.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-black/55">Join the list for curated product releases and deal alerts. Submission wiring comes with the marketing backend batch.</p>
          <form className="mx-auto mt-7 flex max-w-xl gap-2" action="#">
            <label htmlFor="home-email" className="sr-only">Email address</label>
            <input id="home-email" type="email" placeholder="you@example.com" className="min-w-0 flex-1 rounded-full border border-black/12 bg-white px-5 py-3.5 text-sm outline-none focus:border-black/40" />
            <button type="submit" className="rounded-full bg-black px-5 py-3.5 text-sm font-black text-white">Join</button>
          </form>
          <p className="mt-3 text-[10px] font-bold text-black/35">No spam. Unsubscribe anytime.</p>
        </div>
      </Container>
    </section>
  );
}
