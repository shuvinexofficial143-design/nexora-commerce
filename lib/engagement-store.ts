import type { ProductAlert } from "@/types/engagement";

const ALERT_KEY = "nexora-product-alerts-v1";
const NOTIFICATION_KEY = "nexora-engagement-read-v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readProductAlerts(): ProductAlert[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(ALERT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as ProductAlert[]) : [];
  } catch {
    return [];
  }
}

export function writeProductAlerts(alerts: ProductAlert[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(ALERT_KEY, JSON.stringify(alerts));
}

export function upsertProductAlert(alert: ProductAlert) {
  const current = readProductAlerts();
  const next = [alert, ...current.filter((item) => !(item.productId === alert.productId && item.kind === alert.kind))];
  writeProductAlerts(next);
  return next;
}

export function removeProductAlert(id: string) {
  const next = readProductAlerts().filter((item) => item.id !== id);
  writeProductAlerts(next);
  return next;
}

export function hasProductAlert(productId: string, kind: ProductAlert["kind"]) {
  return readProductAlerts().some((item) => item.productId === productId && item.kind === kind && item.active);
}

export function readNotificationIds(): string[] {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTIFICATION_KEY) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export function saveNotificationIds(ids: string[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(Array.from(new Set(ids))));
}
