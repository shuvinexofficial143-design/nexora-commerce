import { apiFetch } from "@/lib/api/http";
import type { BackendSession, BackendUser } from "@/types/backend";
import type { LoginInput, RegisterInput } from "@/types/auth";

export function fetchBackendSession() {
  return apiFetch<{ session: BackendSession | null }>("/api/auth/session");
}

export function loginBackend(input: LoginInput) {
  return apiFetch<{ user: BackendUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: input.email, password: input.password }),
  });
}

export function registerBackend(input: RegisterInput) {
  return apiFetch<{ user: BackendUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logoutBackend() {
  return apiFetch<{ signedOut: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}
