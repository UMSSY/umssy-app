import { formatFileSize } from "@/shared/utils/format-file-size";

export function formatEvidenceSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  return formatFileSize(bytes);
}
