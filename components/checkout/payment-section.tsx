import { PaymentMethodCard } from "@/components/checkout/payment-method-card";
import type { PaymentMethod, PaymentMethodId } from "@/types/checkout";

export function PaymentSection({
  methods,
  selectedId,
  onSelect,
}: {
  methods: PaymentMethod[];
  selectedId: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
}) {
  const onlineEnabled = methods.some(
    (method) => method.id === "cashfree" && method.available !== false,
  );

  return (
    <section className="rounded-[30px] border border-black/10 bg-white p-5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[.16em] text-black/35">03 · Payment</p>
      <h2 className="mt-1 text-xl font-black">Choose payment</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {methods.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            selected={method.id === selectedId}
            onSelect={() => onSelect(method.id)}
          />
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-[#f4f4f0] px-4 py-3 text-xs font-bold leading-5 text-black/55">
        {onlineEnabled
          ? "Online payment uses Cashfree hosted checkout. Nexora confirms payment only after server-side verification."
          : "Cash on delivery is live now. Cashfree code is ready but stays disabled until its API keys and public callback URL are configured."}
      </p>
    </section>
  );
}
