import type { CatalogProduct } from "@/types/catalog";

export type ProductImage = { src: string; alt: string };
export type ProductOption = { label: string; value: string; available?: boolean };
export type ProductOffer = { title: string; description: string; code?: string; tone?: "lime" | "warm" | "plain" };
export type ProductSpecification = { label: string; value: string };
export type ProductSpecGroup = { title: string; items: ProductSpecification[] };
export type ProductReview = {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  helpful: number;
  date: string;
};

export type ProductDetail = CatalogProduct & {
  subtitle: string;
  description: string;
  images: ProductImage[];
  sizes: ProductOption[];
  colorOptions: ProductOption[];
  highlights: string[];
  offers: ProductOffer[];
  specifications: ProductSpecGroup[];
  reviewsList: ProductReview[];
  warranty: string;
  returnPolicy: string;
  seller: string;
  sku: string;
};
