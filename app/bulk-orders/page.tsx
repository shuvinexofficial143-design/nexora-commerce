import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import {submitBulkEnquiryAction} from "@/app/bulk-orders/actions";

export const metadata: Metadata = {
  title: "Society & Bulk Ganesh Orders | Prakriti Ganesh",
  description: "Plan society, mandal, office gifting and larger eco-friendly Ganesh murti requirements.",
};

type Props = { searchParams: Promise<{ submitted?: string; name?: string }> };

export default async function BulkOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const submitted = params.submitted === "1";
  return (
    <main className="pb-20">
      <Container className="py-10 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_.9fr] lg:items-start">
          <section className="rounded-[36px] bg-[#1f3a2e] p-7 text-white sm:p-10 lg:p-12">
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#f4d7a1]">Society · Mandal · Office</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-6xl">Bulk eco Ganesh planning, without the guesswork.</h1>
            <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-white/65">Share required height, quantity, delivery city and customization needs. Your enquiry is securely saved for the Prakriti Ganesh operations team.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Society & mandal murtis", "Office gifting packs", "Size & quantity planning", "Protected large-murti delivery"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-black">✓ {item}</div>)}
            </div>
          </section>

          <section className="rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_24px_80px_rgba(17,17,15,.06)] sm:p-8">
            {submitted ? (
              <div className="py-10 text-center"><div className="text-5xl">🌿</div><h2 className="mt-4 text-3xl font-black text-[#1f3a2e]">Enquiry saved</h2><p className="mt-3 text-sm font-semibold leading-6 text-black/50">Thanks{params.name ? `, ${params.name}` : ""}. Your requirement is now in the Prakriti Ganesh bulk-enquiry queue for follow-up.</p><a href="/bulk-orders" className="mt-6 inline-flex rounded-full bg-[#1f3a2e] px-5 py-3 text-sm font-black text-white">New enquiry</a></div>
            ) : (
              <><p className="text-xs font-black uppercase tracking-[.18em] text-[#a54f2a]">Tell us your requirement</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-[#1f3a2e]">Bulk order enquiry</h2><form action={submitBulkEnquiryAction} className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold sm:col-span-2">Name<input required name="name" className="mt-2 h-12 w-full rounded-2xl border border-black/15 px-4 outline-none focus:border-[#1f3a2e]" /></label><label className="text-sm font-bold">Society / organization<input name="organization" className="mt-2 h-12 w-full rounded-2xl border border-black/15 px-4 outline-none focus:border-[#1f3a2e]" /></label><label className="text-sm font-bold">Phone<input required name="phone" inputMode="tel" className="mt-2 h-12 w-full rounded-2xl border border-black/15 px-4 outline-none focus:border-[#1f3a2e]" /></label><label className="text-sm font-bold">Email<input name="email" type="email" className="mt-2 h-12 w-full rounded-2xl border border-black/15 px-4 outline-none focus:border-[#1f3a2e]" /></label><label className="text-sm font-bold">City<input required name="city" className="mt-2 h-12 w-full rounded-2xl border border-black/15 px-4 outline-none focus:border-[#1f3a2e]" /></label><label className="text-sm font-bold">Approx. height<select name="size" className="mt-2 h-12 w-full rounded-2xl border border-black/15 bg-white px-4"><option>12–18 inch</option><option>18–24 inch</option><option>24–30 inch</option><option>30+ inch</option><option>Gifting minis</option></select></label><label className="text-sm font-bold">Quantity<input name="quantity" type="number" min="1" defaultValue="1" className="mt-2 h-12 w-full rounded-2xl border border-black/15 px-4" /></label><label className="text-sm font-bold">Budget range<input name="budget" placeholder="e.g. ₹15k–₹20k" className="mt-2 h-12 w-full rounded-2xl border border-black/15 px-4" /></label><label className="text-sm font-bold">Needed by<input name="neededBy" type="date" className="mt-2 h-12 w-full rounded-2xl border border-black/15 px-4" /></label><label className="text-sm font-bold sm:col-span-2">Requirement<textarea name="requirement" rows={4} placeholder="Material, finish, event date, customization…" className="mt-2 w-full rounded-2xl border border-black/15 p-4 outline-none focus:border-[#1f3a2e]" /></label><button className="h-12 rounded-full bg-[#1f3a2e] px-6 text-sm font-black text-white sm:col-span-2">Submit bulk enquiry</button></form></>
            )}
          </section>
        </div>
      </Container>
    </main>
  );
}
