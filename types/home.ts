export type Brand = {
  name: string;
  label: string;
  href: string;
};

export type Promo = {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  image: string;
  tone: "dark" | "warm" | "lime";
};

export type SearchTrend = {
  label: string;
  href: string;
};

export type SocialProof = {
  value: string;
  label: string;
};
