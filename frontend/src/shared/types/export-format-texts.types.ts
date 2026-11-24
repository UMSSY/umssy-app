import type { ExportFormat } from "./export-format.types";
import type { ExportFormatText } from "./export-format-text.types";

export type ExportFormatTexts = Readonly<Record<ExportFormat, ExportFormatText>>;
