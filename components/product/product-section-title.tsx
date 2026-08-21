type ProductSectionTitleProps = { eyebrow?: string; title: string; description?: string };
export function ProductSectionTitle({ eyebrow, title, description }: ProductSectionTitleProps) {
  return <div className="mb-5 max-w-2xl">{eyebrow ? <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/40">{eyebrow}</p> : null}<h2 className="mt-1 text-2xl font-black tracking-[-0.03em] sm:text-3xl">{title}</h2>{description ? <p className="mt-2 text-sm leading-6 text-black/55">{description}</p> : null}</div>;
}
