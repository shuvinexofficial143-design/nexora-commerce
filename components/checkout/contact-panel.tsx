export function ContactPanel({ email, onEmail }: { email: string; onEmail: (value: string) => void }) {
  return (
    <section className="rounded-[30px] border border-black/10 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-black/35">Contact</p><h2 className="mt-1 text-xl font-black">Order updates</h2></div><span className="rounded-full bg-[#d7ff47] px-3 py-1 text-xs font-black">Encrypted</span></div>
      <label className="mt-5 block text-xs font-black text-black/55">Email address</label>
      <input required type="email" value={email} onChange={(event) => onEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-black/10 bg-[#f8f8f6] px-4 py-3.5 text-sm font-bold outline-none transition focus:border-black/35" placeholder="you@example.com" />
      <p className="mt-2 text-xs font-bold text-black/35">No account is required. Order, delivery and refund updates will use this address.</p>
    </section>
  );
}
