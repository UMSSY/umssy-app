import { formatFileSize as formatSharedFileSize } from "@/shared/utils/format-file-size";

export function formatFileSize(bytes: number): string {
  return formatSharedFileSize(bytes, {
    decimalSeparator: ".",
    kbDecimals: 1,
    mbDecimals: 1,
    allowBytesUnit: false,
  });
}
