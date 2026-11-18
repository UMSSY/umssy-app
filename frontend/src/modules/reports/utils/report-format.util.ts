const EMPTY_FORMAT_LABEL = "-";
const FORMAT_LABELS: Record<string, string> = { pdf: "PDF", csv: "CSV" };

export function getReportFormatLabel(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return FORMAT_LABELS[extension] ?? EMPTY_FORMAT_LABEL;
}
