import Link from "next/link";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-black/45">{eyebrow}</p>
        ) : null}
        <h2 className="max-w-3xl text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">{title}</h2>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">{description}</p> : null}
      </div>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="shrink-0 text-sm font-black underline decoration-2 underline-offset-4">
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}
