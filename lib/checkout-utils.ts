import type { CheckoutAddress } from "@/types/checkout";

export function formatAddress(address?: CheckoutAddress) {
  if (!address) return "No delivery address selected";
  return `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
}

export function isIndianPin(value: string) { return /^\d{6}$/.test(value.trim()); }
