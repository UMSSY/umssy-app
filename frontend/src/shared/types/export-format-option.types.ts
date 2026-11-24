import type { LucideIcon } from "lucide-react";
import type { ExportFormat } from "./export-format.types";

export interface ExportFormatOption {
  format: ExportFormat;
  icon: LucideIcon;
}
