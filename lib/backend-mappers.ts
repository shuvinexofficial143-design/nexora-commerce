import type { AccountOrder, OrderStatus } from "@/types/account";
import type { AuthSession, AuthUser, UserRole } from "@/types/auth";
import type { BackendOrder, BackendSession, BackendUser } from "@/types/backend";
import type { PaymentMethodId } from "@/types/checkout";

function role(value: BackendUser["role"]): UserRole {
  return value.toLowerCase() as UserRole;
}

export function mapBackendUser(user: BackendUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role(user.role),
    tier: user.role === "ADMIN" ? "Platinum" : "Core",
    verified: user.status === "ACTIVE",
  };
}

export function mapBackendSession(session: BackendSession): AuthSession {
  return {
    user: mapBackendUser(session.user),
    issuedAt: new Date().toISOString(),
    expiresAt: session.expiresAt,
  };
}

function accountStatus(status: BackendOrder["status"]): OrderStatus {
  if (status === "SHIPPED" || status === "PACKED") return "Shipped";
  if (status === "OUT_FOR_DELIVERY") return "Out for delivery";
  if (status === "DELIVERED") return "Delivered";
  if (status === "CANCELLED" || status === "RETURNED" || status === "REFUNDED") return "Cancelled";
  return "Processing";
}

function paymentMethod(value: string | null): PaymentMethodId {
  return ["upi", "card", "cod", "emi"].includes(value ?? "") ? (value as PaymentMethodId) : "upi";
}

function addressText(value: unknown) {
  if (!value || typeof value !== "object") return "Saved delivery address";
  const address = value as Record<string, unknown>;
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .map(String)
    .join(", ");
}

function variantValue(value: unknown, key: string) {
  if (!value || typeof value !== "object") return undefined;
  const item = (value as Record<string, unknown>)[key];
  return item ? String(item) : undefined;
}

export function mapBackendOrder(order: BackendOrder): AccountOrder {
  const method = paymentMethod(order.paymentMethod);

  return {
    id: order.orderNumber,
    createdAt: order.createdAt,
    status: accountStatus(order.status),
    paymentId: method,
    paymentLabel: method === "cod" ? "Cash on Delivery" : method === "emi" ? "EMI / Pay Later" : method.toUpperCase(),
    deliveryLabel: order.shippingMinor > 0 ? "Priority delivery" : "Standard delivery",
    address: addressText(order.shippingAddress),
    email: "",
    items: order.items.map((item) => ({
      id: item.productId,
      lineId: item.id,
      slug: item.product?.slug ?? item.productId,
      name: item.productName,
      brand: item.product?.brand?.name ?? "NEXORA",
      image: item.product?.images?.[0]?.url ?? "📦",
      price: item.unitPriceMinor / 100,
      quantity: item.quantity,
      color: variantValue(item.variant, "color"),
      size: variantValue(item.variant, "size"),
    })),
    subtotal: order.subtotalMinor / 100,
    discount: order.discountMinor / 100,
    shipping: order.shippingMinor / 100,
    tax: order.taxMinor / 100,
    total: order.totalMinor / 100,
    eta: order.status === "DELIVERED" ? "Delivered" : order.status === "OUT_FOR_DELIVERY" ? "Today" : "3–5 days",
    trackingNumber: `NX-${order.id.slice(-8).toUpperCase()}`,
  };
}
