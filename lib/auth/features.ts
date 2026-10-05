export function customerAuthEnabled() {
  return process.env.NEXT_PUBLIC_CUSTOMER_AUTH_ENABLED === "true";
}

export function sellerPortalEnabled() {
  return process.env.SELLER_PORTAL_ENABLED === "true";
}
