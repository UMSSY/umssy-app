import type { ReportPdfFilter } from '../../reports/types/report-pdf-filter.types.js';
import type { HeatmapResponse } from './heatmap-response.types.js';

export interface HeatmapPdfContentInput {
  heatmap: HeatmapResponse;
  filters: readonly ReportPdfFilter[];
  generatedBy: string;
  generatedAt: Date;
}
