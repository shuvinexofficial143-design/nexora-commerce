import type { AuthSession } from "@/types/auth";

const STORAGE_KEY = "nexora-auth-session-v1";
const COOKIE_KEY = "nexora_session";

export function createDemoSession(input: { name: string; email: string }): AuthSession {
  const issued = new Date();
  const expires = new Date(issued.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { user: { id: `demo-${input.email.toLowerCase().replace(/[^a-z0-9]/g, "-")}`, name: normaliseName(input.name), email: input.email.toLowerCase(), role: "customer", tier: "Core", verified: true }, issuedAt: issued.toISOString(), expiresAt: expires.toISOString() };
}

export function readDemoSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem(STORAGE_KEY); if (!raw) return null; const session = JSON.parse(raw) as AuthSession; if (!session?.user?.email || Date.parse(session.expiresAt) <= Date.now()) { clearDemoSession(); return null; } return session; } catch { clearDemoSession(); return null; }
}

export function writeDemoSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  document.cookie = `${COOKIE_KEY}=demo; Path=/; Max-Age=604800; SameSite=Lax`;
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function normaliseName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "Nexora Member";
  return trimmed.split(/\s+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
