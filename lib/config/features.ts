export function publicCustomerAuthEnabled() {
  return process.env.PUBLIC_CUSTOMER_AUTH_ENABLED === "true";
}


export function multiVendorEnabled() {
  return process.env.MULTI_VENDOR_ENABLED === "true";
}
