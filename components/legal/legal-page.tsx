import Link from "next/link";
import { Container } from "@/components/ui/container";

export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ title: string; body: React.ReactNode }>;
}) {
  return (
    <main className="pb-24 pt-10 sm:pt-14">
      <Container>
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-black/35">{eyebrow}</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.06em] sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-black/55">{intro}</p>

          <div className="mt-10 space-y-4">
            {sections.map((section) => (
              <section key={section.title} className="rounded-[28px] border border-black/10 bg-white p-5 sm:p-7">
                <h2 className="text-xl font-black tracking-[-.03em]">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm font-medium leading-7 text-black/60">{section.body}</div>
              </section>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-full bg-black px-5 py-3 text-sm font-black text-white">
              Contact support
            </Link>
            <Link href="/shop" className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-black">
              Back to shop
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
