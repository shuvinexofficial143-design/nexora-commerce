export type Category = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  image: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  image: string;
  colors: string[];
};

export type NavigationItem = {
  label: string;
  href: string;
  featured?: boolean;
};

export type Money = {
  amount: number;
  currency: "INR" | "USD";
};
