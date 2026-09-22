export type BackendUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "CUSTOMER" | "SELLER" | "SUPPORT" | "ADMIN";
  status: "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";
  createdAt: string;
};

export type BackendSession = {
  id: string;
  expiresAt: string;
  user: BackendUser;
};

export type BackendProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string | null;
  description: string;
  priceMinor: number;
  compareAtMinor: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  images: { url: string; alt: string }[];
  availableStock: number;
  createdAt: string;
};

export type BackendOrderProduct = {
  id: string;
  slug: string;
  name: string;
  brand: { name: string } | null;
  images: { url: string; alt: string }[];
};

export type BackendOrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  variant: unknown;
  product?: BackendOrderProduct;
};

export type BackendOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "PACKED"
    | "SHIPPED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURN_REQUESTED"
    | "RETURNED"
    | "REFUNDED";
  paymentStatus:
    | "PENDING"
    | "AUTHORIZED"
    | "PAID"
    | "FAILED"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED";
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
  paymentMethod: string | null;
  shippingAddress: unknown;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: BackendOrderItem[];
};

export type BackendReturn = {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  details: string | null;
  status: string;
  refundMinor: number;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductResolution = {
  slug: string;
  id: string;
  name: string;
  availableStock: number;
};

export type CreateOrderPayload = {
  items: Array<{
    productId: string;
    quantity: number;
    variant?: Record<string, string>;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  paymentMethod?: string;
  coupon?: string;
  notes?: string;
};

export type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
