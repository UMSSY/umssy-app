import { FileSpreadsheet, FileText } from "lucide-react";
import type { ExportFormatOption } from "@/shared/types/export-format-option.types";

export const EXPORT_FORMAT_OPTIONS: readonly ExportFormatOption[] = [
  { format: "pdf", icon: FileText },
  { format: "csv", icon: FileSpreadsheet },
];
