import { formatBoliviaDate } from '../../../common/utils/date-time.js';
import type { ReportPdfFilter } from '../../reports/types/report-pdf-filter.types.js';
import type { CareerResponse } from '../../surveys/responses/career.response.js';
import {
  HEATMAP_PDF_MONTHS,
  HEATMAP_PDF_TEXT,
} from '../constants/heatmap-pdf.constants.js';
import type { HeatmapQuery } from '../types/heatmap-query.types.js';

export function buildHeatmapPdfFilters(
  query: HeatmapQuery,
  careers: readonly CareerResponse[],
): ReportPdfFilter[] {
  const career = careers.find((item) => item.id === query.careerId);
  const filters: ReportPdfFilter[] = [
    {
      label: HEATMAP_PDF_TEXT.careerFilter,
      value: career?.title ?? HEATMAP_PDF_TEXT.allCareers,
    },
  ];

  if (query.startTimestamp && query.endTimestamp) {
    filters.push({
      label: HEATMAP_PDF_TEXT.rangeFilter,
      value: HEATMAP_PDF_TEXT.range(
        formatBoliviaDate(query.startTimestamp),
        formatBoliviaDate(query.endTimestamp),
      ),
    });
  } else {
    filters.push({
      label: HEATMAP_PDF_TEXT.yearFilter,
      value: query.year !== undefined ? String(query.year) : HEATMAP_PDF_TEXT.allYears,
    });
  }

  filters.push({
    label: HEATMAP_PDF_TEXT.monthFilter,
    value:
      query.month !== undefined
        ? HEATMAP_PDF_MONTHS[query.month - 1]!
        : HEATMAP_PDF_TEXT.allMonths,
  });
  return filters;
}
