const KILOBYTE = 1024;

export function formatEvidenceSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < KILOBYTE) return `${bytes} B`;

  const kilobytes = bytes / KILOBYTE;
  if (kilobytes < KILOBYTE) return `${Math.round(kilobytes)} KB`;

  return `${(kilobytes / KILOBYTE).toLocaleString("es-BO", { maximumFractionDigits: 1 })} MB`;
}
