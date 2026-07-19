export function sanitizeDownloadSlug(value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return slug || "diana-benchmark";
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.rel = "noopener"; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

export function downloadBytes(bytes: Uint8Array, filename: string, type: string): void {
  downloadBlob(new Blob([bytes as BlobPart], { type }), filename);
}
