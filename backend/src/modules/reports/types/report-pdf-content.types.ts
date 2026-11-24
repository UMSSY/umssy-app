import type { ReportPdfColumn } from './report-pdf-column.types.js';
import type { ReportPdfFilter } from './report-pdf-filter.types.js';

export interface ReportPdfContent {
  readonly title: string;
  readonly subtitle: string;
  readonly generatedBy: string;
  readonly generatedAt: Date;
  readonly filters: readonly ReportPdfFilter[];
  readonly columns: readonly ReportPdfColumn[];
  readonly rows: readonly (readonly string[])[];
  readonly totalLabel: string;
  readonly cellFills?: readonly (readonly (string | undefined)[])[];
}
