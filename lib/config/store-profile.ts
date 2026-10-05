function clean(value?: string) {
  return value?.trim() || "";
}

export function getStoreProfile() {
  return {
    displayName: clean(process.env.STORE_DISPLAY_NAME) || "NEXORA",
    legalName: clean(process.env.STORE_LEGAL_NAME),
    supportEmail: clean(process.env.STORE_SUPPORT_EMAIL),
    supportPhone: clean(process.env.STORE_SUPPORT_PHONE),
    whatsappNumber: clean(process.env.STORE_WHATSAPP_NUMBER),
    businessAddress: clean(process.env.STORE_BUSINESS_ADDRESS),
    gstin: clean(process.env.STORE_GSTIN).toUpperCase(),
  };
}

export function storeProfileStatus() {
  const profile = getStoreProfile();
  const required = [
    ["STORE_SUPPORT_EMAIL", profile.supportEmail],
    ["STORE_SUPPORT_PHONE", profile.supportPhone],
    ["STORE_BUSINESS_ADDRESS", profile.businessAddress],
  ] as const;

  const missing = required
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    configured: missing.length === 0,
    missing,
  };
}

export function whatsappUrl(number: string) {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}
