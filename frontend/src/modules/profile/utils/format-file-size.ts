import { BYTES_PER_KB, BYTES_PER_MB } from "../config/file-upload.config";

function formatOneDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatFileSize(bytes: number): string {
  if (bytes < BYTES_PER_MB) {
    return `${formatOneDecimal(bytes / BYTES_PER_KB)} KB`;
  }

  return `${formatOneDecimal(bytes / BYTES_PER_MB)} MB`;
}
