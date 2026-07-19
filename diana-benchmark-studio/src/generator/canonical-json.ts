function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, item]) => [key, canonicalValue(item)]));
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new TypeError("Canonical JSON rejects non-finite numbers");
  return value;
}

export function canonicalize(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}
