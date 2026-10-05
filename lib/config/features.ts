export function publicCustomerAuthEnabled() {
  return process.env.PUBLIC_CUSTOMER_AUTH_ENABLED === "true";
}
