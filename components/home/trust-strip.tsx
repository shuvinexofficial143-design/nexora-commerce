import { Container } from "@/components/ui/container";

const trustItems = [
  ["01", "Protected payments", "Checkout architecture designed for trusted gateways and clear payment states."],
  ["02", "Easy returns", "Self-serve return and refund flows will connect to customer accounts later."],
  ["03", "Fast delivery", "Delivery estimates, warehouse selection and live tracking are on the roadmap."],
  ["04", "Real support", "AI help plus human escalation is planned as a first-class customer experience."],
] as const;

export function TrustStrip() {
  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="grid overflow-hidden rounded-[28px] border border-black/10 bg-white sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map(([number, title, description], index) => (
            <div
              key={title}
              className={`p-6 sm:p-7 ${index > 0 ? "border-t border-black/10 sm:border-t-0" : ""} ${index % 2 === 1 ? "sm:border-l sm:border-black/10" : ""} ${index > 1 ? "lg:border-l lg:border-black/10" : ""}`}
            >
              <p className="text-[10px] font-black tracking-[0.18em] text-black/30">{number}</p>
              <h3 className="mt-7 text-lg font-black tracking-[-0.03em]">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-black/50">{description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
