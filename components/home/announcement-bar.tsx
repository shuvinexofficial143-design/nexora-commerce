import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="bg-[#171714] px-4 py-2.5 text-center text-[11px] font-bold text-white sm:text-xs">
      <span className="text-white/65">NEXORA WEEK:</span> extra 10% off selected essentials with code <strong>NEXORA10</strong>.{" "}
      <Link href="/deals" className="underline underline-offset-4">Shop deals</Link>
    </div>
  );
}
