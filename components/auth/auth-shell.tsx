import Link from "next/link";
import { AuthBenefits } from "@/components/auth/auth-benefits";

export function AuthShell({ eyebrow, title, description, children, footer }: { eyebrow: string; title: string; description: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <section className="min-h-[calc(100vh-180px)] py-8 sm:py-14">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_35px_100px_rgba(17,17,15,.10)] lg:grid-cols-[1.05fr_.95fr]">
        <AuthBenefits />
        <div className="p-6 sm:p-10 lg:p-12">
          <Link href="/" className="text-sm font-black tracking-[-0.04em]">NEXORA.</Link>
          <div className="mt-10 max-w-md">
            <p className="text-xs font-black uppercase tracking-[.2em] text-black/45">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">{title}</h1>
            <p className="mt-4 text-sm leading-6 text-black/55">{description}</p>
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-7 border-t border-black/10 pt-6 text-sm text-black/55">{footer}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
