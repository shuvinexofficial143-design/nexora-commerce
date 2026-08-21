import { Container } from "@/components/ui/container";
import { socialProof } from "@/lib/home-data";

export function SocialProofStrip() {
  return (
    <section className="py-10">
      <Container>
        <div className="grid overflow-hidden rounded-[28px] border border-black/8 bg-white sm:grid-cols-2 lg:grid-cols-4">
          {socialProof.map((item, index) => (
            <div key={item.label} className={`p-6 text-center ${index ? "border-t border-black/8 sm:border-l sm:border-t-0" : ""} ${index === 2 ? "sm:border-l-0 lg:border-l" : ""}`}>
              <div className="text-2xl font-black tracking-[-0.05em]">{item.value}</div>
              <div className="mt-1 text-[11px] font-bold text-black/45">{item.label}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
