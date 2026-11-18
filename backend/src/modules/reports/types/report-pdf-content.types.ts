import type { ReportPdfDefinition } from './report-pdf-definition.types.js';
import type { ReportPdfFilter } from './report-pdf-filter.types.js';

export interface ReportPdfContent extends ReportPdfDefinition {
  readonly generatedBy: string;
  readonly generatedAt: Date;
  readonly filters: readonly ReportPdfFilter[];
  readonly rows: readonly (readonly string[])[];
}
