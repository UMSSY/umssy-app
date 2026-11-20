import type { ReactNode } from "react";
import type { ExportFormat } from "./export-format.types";
import type { ExportFormatTexts } from "./export-format-texts.types";

export interface ExportFormatMenuProps {
  triggerLabel: string;
  formatTexts: ExportFormatTexts;
  onSelectFormat: (format: ExportFormat) => void;
  formatHeading?: string;
  cancelLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  contentClassName?: string;
  children?: ReactNode;
}
