import { toFileSizeParts } from "@/shared/utils/format-file-size";
import { TRAILING_ZERO_DECIMAL_PATTERN } from "../constants/file-size.constants";

export function formatFileSize(bytes: number): string {
  const { value, unit } = toFileSizeParts(bytes, "KB");
  return `${value.toFixed(1).replace(TRAILING_ZERO_DECIMAL_PATTERN, "")} ${unit}`;
}
