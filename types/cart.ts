export type CartProductSnapshot = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  stock: "in-stock" | "low-stock" | "out-of-stock";
};

export type CartLine = CartProductSnapshot & {
  lineId: string;
  quantity: number;
  color?: string;
  size?: string;
};

export type SavedLine = CartLine & { savedAt: string };

export type WishlistItem = CartProductSnapshot & { addedAt: string };

export type CartTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
};
