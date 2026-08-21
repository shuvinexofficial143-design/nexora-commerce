import Image from "next/image";
import Link from "next/link";
import type { Promo } from "@/types/home";

const toneClasses = {
  dark: "bg-[#171714] text-white",
  warm: "bg-[#ffefe1] text-[#171714]",
  lime: "bg-[#d7ff47] text-[#171714]",
};

export function PromoCard({ promo, large = false }: { promo: Promo; large?: boolean }) {
  return (
    <article className={`group relative overflow-hidden rounded-[30px] ${toneClasses[promo.tone]} ${large ? "min-h-[520px]" : "min-h-[390px]"}`}>
      <Image
        src={promo.image}
        alt=""
        fill
        sizes={large ? "(max-width: 1024px) 100vw, 58vw" : "(max-width: 1024px) 100vw, 42vw"}
        className="object-cover opacity-55 transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-10 p-6 text-white sm:p-8 lg:p-10">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">{promo.eyebrow}</p>
        <h3 className={`mt-3 max-w-xl font-black tracking-[-0.05em] ${large ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}>
          {promo.title}
        </h3>
        <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">{promo.description}</p>
        <Link href={promo.href} className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:scale-[1.02]">
          {promo.cta} →
        </Link>
      </div>
    </article>
  );
}
