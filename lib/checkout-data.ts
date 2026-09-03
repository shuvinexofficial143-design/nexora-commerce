import type { CheckoutAddress, DeliveryOption, PaymentMethod } from "@/types/checkout";

export const defaultAddresses: CheckoutAddress[] = [
  { id: "home", label: "Home", fullName: "Prakriti Customer", phone: "+91 98765 43210", line1: "42 Mahakal Road", city: "Ujjain", state: "Madhya Pradesh", postalCode: "456001", country: "India" },
  { id: "alternate", label: "Alternate", fullName: "Prakriti Customer", phone: "+91 98765 43210", line1: "18 Freeganj", city: "Ujjain", state: "Madhya Pradesh", postalCode: "456010", country: "India" },
];

export const deliveryOptions: DeliveryOption[] = [
  { id: "standard", label: "Careful standard delivery", eta: "Protective packing · arrives in 3–5 business days", price: 0, badge: "Best value" },
  { id: "express", label: "Festival express delivery", eta: "Priority packing · arrives in 1–2 business days", price: 149, badge: "Faster" },
  { id: "bulk", label: "Society / bulk coordination", eta: "Our team coordinates larger or multiple-murti orders", price: 299, badge: "Bulk orders" },
];

export const paymentMethods: PaymentMethod[] = [
  { id: "upi", label: "UPI", description: "Google Pay, PhonePe, Paytm & UPI apps", icon: "⚡" },
  { id: "card", label: "Card", description: "Credit and debit cards", icon: "💳" },
  { id: "cod", label: "Cash on delivery", description: "Available on eligible murti sizes and pincodes", icon: "📦" },
  { id: "emi", label: "EMI / Pay later", description: "Available through eligible bank/provider plans", icon: "◫" },
];
