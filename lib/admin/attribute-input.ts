// Shared, framework-independent product-attribute editor contract.
export type ProductAttributeDefinition = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  type: string;
  required: boolean;
  active: boolean;
  options: unknown;
};

export function activeProductAttributes(
  definitions: ProductAttributeDefinition[],
  categoryId: string | undefined,
): ProductAttributeDefinition[] {
  return categoryId ? definitions.filter((definition) => definition.active && definition.categoryId === categoryId) : [];
}

export function attributeOptions(definition: ProductAttributeDefinition): string[] {
  return Array.isArray(definition.options)
    ? definition.options.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

export function normalizeAttributeDraft(
  definitions: ProductAttributeDefinition[],
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const definition of definitions.filter((item) => item.active)) {
    const value = raw[definition.slug];
    const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length);
    if (empty) {
      if (definition.required) throw new Error(definition.name + " is required.");
      continue;
    }
    switch (definition.type) {
      case "NUMBER": {
        const numberValue = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
        if (!Number.isFinite(numberValue)) throw new Error(definition.name + " must be a number.");
        output[definition.slug] = numberValue;
        break;
      }
      case "BOOLEAN":
        if (typeof value !== "boolean") throw new Error(definition.name + " must be true or false.");
        output[definition.slug] = value;
        break;
      case "SELECT":
      case "COLOR": {
        if (typeof value !== "string" || !attributeOptions(definition).includes(value)) throw new Error(definition.name + " has an invalid selection.");
        output[definition.slug] = value;
        break;
      }
      case "MULTI_SELECT": {
        const options = attributeOptions(definition);
        if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && options.includes(item))) {
          throw new Error(definition.name + " has invalid selections.");
        }
        output[definition.slug] = [...new Set(value)];
        break;
      }
      case "DATE": {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
          throw new Error(definition.name + " must be a valid date.");
        }
        output[definition.slug] = value;
        break;
      }
      case "TEXT":
      case "IMAGE_REQUEST": {
        if (typeof value !== "string" || !value.trim() || value.length > 2000) {
          throw new Error(definition.name + " must be text under 2000 characters.");
        }
        output[definition.slug] = value.trim();
        break;
      }
      default: throw new Error("Unsupported attribute type.");
    }
  }
  return output;
}
