import { ValidationError } from "@/lib/db/errors";

export type ProductChoiceValue = { value: string; label: string; available: boolean };
export type ProductChoiceGroup = {
  key: string; label: string; required: boolean; sortOrder: number; values: ProductChoiceValue[];
};
const keyRe = /^[a-z][a-z0-9_-]{0,39}$/;
const valueRe = /^[a-z0-9][a-z0-9_-]{0,59}$/;
const text = (x: unknown, length: number) => typeof x === "string" ? x.trim().slice(0, length + 1) : "";

export function parseProductChoiceGroups(input: unknown): ProductChoiceGroup[] {
  if (!Array.isArray(input) || input.length > 8) throw new ValidationError("Enter up to eight product option groups.");
  const keys = new Set<string>();
  return input.map((group, sortOrder) => {
    if (!group || typeof group !== "object" || Array.isArray(group)) throw new ValidationError("Invalid option group.");
    const data = group as Record<string, unknown>;
    const key = text(data.key, 40).toLowerCase();
    const label = text(data.label, 60);
    if (!keyRe.test(key) || keys.has(key) || label.length < 2 || label.length > 60
      || typeof data.required !== "boolean") throw new ValidationError("Invalid, duplicate or missing option group.");
    keys.add(key);
    if (!Array.isArray(data.values) || !data.values.length || data.values.length > 20) {
      throw new ValidationError("Each option group needs 1 to 20 values.");
    }
    const seen = new Set<string>();
    const values = data.values.map((raw: unknown) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new ValidationError("Invalid option value.");
      const entry = raw as Record<string, unknown>;
      const value = text(entry.value, 60).toLowerCase();
      const optionLabel = text(entry.label, 80);
      if (!valueRe.test(value) || seen.has(value) || optionLabel.length < 1 || optionLabel.length > 80
        || typeof entry.available !== "boolean") throw new ValidationError("Invalid or duplicate option value.");
      seen.add(value);
      return { value, label: optionLabel, available: entry.available };
    });
    if (data.required && values.every((item) => !item.available)) {
      throw new ValidationError("A required group needs at least one available value.");
    }
    return { key, label, required: data.required, values, sortOrder };
  });
}

export function normalizeChosenOptions(input: unknown): Record<string, string> {
  if (input === undefined || input === null) return {};
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ValidationError("Invalid selected product options.");
  const raw = input as Record<string, unknown>;
  const keys = Object.keys(raw);
  if (keys.length > 8) throw new ValidationError("Too many selected product options.");
  const entries = keys.map((key) => {
    if (!keyRe.test(key) || typeof raw[key] !== "string" || !valueRe.test(raw[key])) {
      throw new ValidationError("Invalid product option selection.");
    }
    return [key, raw[key] as string] as const;
  });
  return Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)));
}

export function validateChosenOptions(groups: ProductChoiceGroup[], raw: unknown) {
  const chosen = normalizeChosenOptions(raw);
  const allowed = new Map(groups.map((group) => [group.key, group]));
  for (const group of groups) {
    if (group.required && !chosen[group.key]) throw new ValidationError(`Choose ${group.label} before checkout.`);
  }
  for (const [key, value] of Object.entries(chosen)) {
    const group = allowed.get(key);
    if (!group) throw new ValidationError(`The ${key} option is no longer offered.`);
    if (!group.values.some((entry) => entry.value === value && entry.available)) {
      throw new ValidationError(`The selected ${group.label} option is not available.`);
    }
  }
  return chosen;
}

export function deserializeProductChoiceGroups(input: Array<{
  key: string; label: string; required: boolean; sortOrder: number; values: unknown
}>): ProductChoiceGroup[] {
  // Read-only DB values still require validation. Fail closed on corrupt data.
  return parseProductChoiceGroups(input
    .slice().sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group) => ({ key: group.key, label: group.label, required: group.required, values: group.values })));
}
