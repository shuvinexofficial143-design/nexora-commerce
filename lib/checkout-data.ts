import type { CheckoutAddress, DeliveryOption, PaymentMethod } from "@/types/checkout";

export const defaultAddresses: CheckoutAddress[] = [
  { id: "home", label: "Home", fullName: "Nexora Customer", phone: "+91 98765 43210", line1: "42 Market Street", city: "Indore", state: "Madhya Pradesh", postalCode: "452001", country: "India" },
  { id: "work", label: "Work", fullName: "Nexora Customer", phone: "+91 98765 43210", line1: "18 Business Avenue", city: "Indore", state: "Madhya Pradesh", postalCode: "452010", country: "India" },
];

export const deliveryOptions: DeliveryOption[] = [
  { id: "standard", label: "Standard delivery", eta: "Delivery availability and date confirmed by the store after order acceptance", price: 0 },
];
// Do not offer unverified paid express/same-day shipping without a courier
// integration and a serviceability check for the customer's PIN code.

const cashfreeEnabled = process.env.NEXT_PUBLIC_CASHFREE_ENABLED === "true";

export const paymentMethods: PaymentMethod[] = [
  {
    id: "cod",
    label: "Cash on delivery",
    description: "Pay when your order arrives",
    icon: "📦",
    available: true,
    badge: "Available",
  },
  {
    id: "cashfree",
    label: "Online payment",
    description: cashfreeEnabled
      ? "UPI, cards and other enabled methods via Cashfree"
      : "Ready in code — enable after Cashfree keys are configured",
    icon: "⚡",
    available: cashfreeEnabled,
    badge: cashfreeEnabled ? "Cashfree" : "Not enabled",
  },
];
