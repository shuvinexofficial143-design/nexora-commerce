export type CheckoutStep = 1 | 2 | 3 | 4;

export type CheckoutAddress = {
  id: string; label: string; fullName: string; phone: string; line1: string; city: string; state: string; postalCode: string; country: string;
};

export type DeliveryMethodId = "standard" | "express" | "priority";
export type DeliveryOption = { id: DeliveryMethodId; label: string; eta: string; price: number; badge?: string };
export type PaymentMethodId = "cod" | "cashfree";
export type PaymentMethod = { id: PaymentMethodId; label: string; description: string; icon: string; available?: boolean; badge?: string };
