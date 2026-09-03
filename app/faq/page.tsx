import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "FAQ | Prakriti Ganesh",
  description: "Answers about eco-friendly Ganesh murtis, sizes, materials, delivery, visarjan and bulk orders.",
};

const faqs = [
  ["What is Shadu Mati?", "Shadu Mati is a natural clay traditionally used for Ganesh murtis. Product pages clearly identify the listed material or finish for each murti."],
  ["Which size is good for a home celebration?", "Compact 5–8 inch murtis suit smaller spaces, while 9–15 inch options are common for larger home setups. Choose based on your mandap and available space."],
  ["What is a Seed Ganesh?", "Seed Ganesh products in the catalog are positioned as plantable or seed-based eco options. Follow the care and post-festival instructions supplied with the specific product."],
  ["Do you have society or mandal sizes?", "Yes. The Bulk Orders collection includes larger 24-inch and 30-inch examples along with gifting packs. Use the bulk-order page for quantity and customization requirements."],
  ["How long does delivery take?", "Delivery estimates vary by product and size. Smaller in-stock pieces can have shorter windows, while large or artisan pieces need more preparation time."],
  ["Can I pay by UPI or Cash on Delivery?", "The checkout supports UPI, cards and COD options in the current storefront flow. Actual payment availability can be finalized when the production payment gateway is connected."],
  ["How should eco-friendly visarjan be handled?", "Follow local rules and the material-specific instructions supplied with the murti. Natural-clay and seed products can have different post-festival care requirements."],
];

export default function FaqPage() {
  return (
    <main className="pb-20">
      <Container className="py-10 sm:py-16">
        <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-[#a54f2a]">Help centre</p><h1 className="mt-3 text-4xl font-black tracking-[-.055em] text-[#1f3a2e] sm:text-6xl">Ganesh murti FAQs</h1><p className="mt-4 text-base font-semibold leading-7 text-black/50">Quick answers for choosing, ordering and preparing for your celebration.</p></div>
        <div className="mt-8 space-y-3">
          {faqs.map(([question, answer]) => <details key={question} className="group rounded-[24px] border border-black/10 bg-white p-5 sm:p-6"><summary className="cursor-pointer list-none text-lg font-black text-[#1f3a2e]">{question}<span className="float-right text-black/35 group-open:rotate-45">+</span></summary><p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-black/50">{answer}</p></details>)}
        </div>
        <div className="mt-8 rounded-[28px] bg-[#f4ead7] p-6"><p className="font-black text-[#1f3a2e]">Need help choosing a murti?</p><div className="mt-3 flex flex-wrap gap-3"><Link href="/ai-assistant" className="rounded-full bg-[#1f3a2e] px-5 py-3 text-sm font-black text-white">Ask Ganesh guide</Link><Link href="/bulk-orders" className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-black">Bulk enquiry</Link></div></div>
      </Container>
    </main>
  );
}
