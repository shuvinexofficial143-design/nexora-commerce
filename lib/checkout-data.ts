import type { CheckoutAddress, DeliveryOption, PaymentMethod } from "@/types/checkout";

export const defaultAddresses: CheckoutAddress[] = [
  { id: "home", label: "Home", fullName: "Nexora Customer", phone: "+91 98765 43210", line1: "42 Market Street", city: "Indore", state: "Madhya Pradesh", postalCode: "452001", country: "India" },
  { id: "work", label: "Work", fullName: "Nexora Customer", phone: "+91 98765 43210", line1: "18 Business Avenue", city: "Indore", state: "Madhya Pradesh", postalCode: "452010", country: "India" },
];

export const deliveryOptions: DeliveryOption[] = [
  { id: "standard", label: "Standard delivery", eta: "Arrives in 3–5 business days", price: 0, badge: "Best value" },
  { id: "express", label: "Express delivery", eta: "Arrives in 1–2 business days", price: 149, badge: "Faster" },
  { id: "priority", label: "Priority same-day", eta: "Eligible metros · order before 2 PM", price: 299, badge: "Fastest" },
];

export const paymentMethods: PaymentMethod[] = [
  { id: "upi", label: "UPI", description: "Google Pay, PhonePe, Paytm & UPI apps", icon: "⚡" },
  { id: "card", label: "Card", description: "Credit and debit cards", icon: "💳" },
  { id: "cod", label: "Cash on delivery", description: "Eligibility checked before dispatch", icon: "📦" },
  { id: "emi", label: "EMI / Pay later", description: "Bank and provider plans", icon: "◫" },
];
