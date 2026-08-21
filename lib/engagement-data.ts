import { catalogProducts } from "@/lib/catalog-data";
import type { EngagementNotification, FlashSaleItem, ReferralInvite, RewardActivity } from "@/types/engagement";

export const rewardSummary = {
  points: 2840,
  lifetimePoints: 7920,
  tier: "Elite" as const,
  nextTier: "Icon",
  nextTierAt: 10000,
  rupeeValue: 284,
};

export const rewardActivity: RewardActivity[] = [
  { id: "rw_1", label: "Order NX-842713", points: 420, date: "18 Aug 2026", kind: "earn" },
  { id: "rw_2", label: "Review bonus", points: 75, date: "16 Aug 2026", kind: "earn" },
  { id: "rw_3", label: "Free-delivery reward", points: 300, date: "11 Aug 2026", kind: "redeem" },
  { id: "rw_4", label: "Referral reward", points: 500, date: "08 Aug 2026", kind: "earn" },
];

export const referralInvites: ReferralInvite[] = [
  { id: "rf_1", name: "Aman", status: "rewarded", reward: 250 },
  { id: "rf_2", name: "Riya", status: "joined", reward: 0 },
  { id: "rf_3", name: "Kabir", status: "invited", reward: 0 },
];

export const referralCode = "NEXORA-VIP250";

export const engagementNotifications: EngagementNotification[] = [
  { id: "en_1", title: "Price dropped by ₹1,000", message: "Airwave Max Wireless Headphones just moved into your target range.", time: "12 min ago", icon: "↓", read: false, href: "/product/airwave-max-headphones", category: "deal" },
  { id: "en_2", title: "+420 Nexora Points", message: "Your latest order earned Elite-tier reward points.", time: "2 hr ago", icon: "✦", read: false, href: "/account/rewards", category: "reward" },
  { id: "en_3", title: "Back in stock", message: "Ceramic Aroma Diffuser is available again in limited quantity.", time: "Yesterday", icon: "↻", read: true, href: "/product/ceramic-aroma-diffuser", category: "stock" },
  { id: "en_4", title: "Flash sale unlocked", message: "Elite members get early access to tonight's limited-stock offers.", time: "Yesterday", icon: "⚡", read: true, href: "/deals/flash-sale", category: "deal" },
];

const saleSeeds: Array<[string, number, number, number]> = [
  ["cat_001", 6499, 62, 100],
  ["cat_007", 15999, 31, 45],
  ["cat_009", 21999, 74, 120],
  ["cat_015", 999, 108, 150],
  ["cat_017", 5499, 22, 35],
  ["cat_019", 2799, 48, 80],
];

export const flashSaleItems: FlashSaleItem[] = saleSeeds.flatMap(([productId, salePrice, claimed, limit]) => {
  const product = catalogProducts.find((item) => item.id === productId);
  return product ? [{ productId, slug: product.slug, salePrice, claimed, limit }] : [];
});

export function getFlashSaleProduct(productId: string) {
  return catalogProducts.find((product) => product.id === productId);
}
