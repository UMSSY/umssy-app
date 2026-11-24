export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = BYTES_PER_KB * 1024;

export type FileSizeUnit = "B" | "KB" | "MB";

export interface FileSizeParts {
  value: number;
  unit: FileSizeUnit;
}

export function toFileSizeParts(bytes: number, smallestUnit: FileSizeUnit = "B"): FileSizeParts {
  const safeBytes = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (safeBytes >= BYTES_PER_MB) return { value: safeBytes / BYTES_PER_MB, unit: "MB" };
  if (safeBytes >= BYTES_PER_KB || smallestUnit === "KB") {
    return { value: safeBytes / BYTES_PER_KB, unit: "KB" };
  }
  return { value: safeBytes, unit: "B" };
}

// Tamaño legible en español: coma decimal y sin ",0" sobrante (por ejemplo "340 KB", "2,3 MB")
export function formatFileSize(bytes: number): string {
  const { value, unit } = toFileSizeParts(bytes);
  if (unit === "B") return `${value} B`;
  if (unit === "KB") return `${Math.round(value)} KB`;
  return `${String(Math.round(value * 10) / 10).replace(".", ",")} MB`;
}
