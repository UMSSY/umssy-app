import type { FormatFileSizeOptions } from "@/shared/types/format-file-size-options.types";

export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = BYTES_PER_KB * 1024;

function formatDecimal(
  value: number,
  decimals: 0 | 1 | 2,
  decimalSeparator: "," | ".",
): string {
  const rounded =
    decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
  const trimmed = decimals > 0 ? rounded.replace(/\.0+$/, "") : rounded;
  return decimalSeparator === "," ? trimmed.replace(".", ",") : trimmed;
}

export function formatFileSize(
  bytes: number,
  options: FormatFileSizeOptions = {},
): string {
  const {
    decimalSeparator = ",",
    kbDecimals = 0,
    mbDecimals = 1,
    allowBytesUnit = true,
  } = options;

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return allowBytesUnit ? "0 B" : "0 KB";
  }

  if (allowBytesUnit && bytes < BYTES_PER_KB) {
    return `${bytes} B`;
  }

  if (bytes < BYTES_PER_MB) {
    return `${formatDecimal(bytes / BYTES_PER_KB, kbDecimals, decimalSeparator)} KB`;
  }

  return `${formatDecimal(bytes / BYTES_PER_MB, mbDecimals, decimalSeparator)} MB`;
}
