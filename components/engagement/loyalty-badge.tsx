import Link from "next/link";
import { rewardSummary } from "@/lib/engagement-data";
export function LoyaltyBadge(){return <Link href="/account/rewards" className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-black"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#d7ff47]">✦</span>{rewardSummary.tier} · {rewardSummary.points.toLocaleString("en-IN")} pts</Link>}
