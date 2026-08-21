export type RewardTier = "Explorer" | "Insider" | "Elite" | "Icon";

export type RewardActivity = {
  id: string;
  label: string;
  points: number;
  date: string;
  kind: "earn" | "redeem";
};

export type ReferralInvite = {
  id: string;
  name: string;
  status: "invited" | "joined" | "rewarded";
  reward: number;
};

export type ProductAlert = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  kind: "price-drop" | "back-in-stock";
  targetPrice?: number;
  currentPrice: number;
  active: boolean;
  createdAt: string;
};

export type EngagementNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: string;
  read: boolean;
  href?: string;
  category: "order" | "deal" | "reward" | "stock" | "account";
};

export type FlashSaleItem = {
  productId: string;
  slug: string;
  salePrice: number;
  claimed: number;
  limit: number;
};
