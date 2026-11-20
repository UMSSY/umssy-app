import type { ReportPdfContent } from '../../reports/types/report-pdf-content.types.js';
import {
  HEATMAP_PDF_SKILL_COLUMN_WIDTH,
  HEATMAP_PDF_TABLE_WIDTH,
  HEATMAP_PDF_TEXT,
  HEATMAP_PDF_TITLES,
  HEATMAP_PDF_TONES,
} from '../constants/heatmap-pdf.constants.js';
import type { HeatmapCell } from '../types/heatmap-cell.types.js';
import type { HeatmapExtraValue } from '../types/heatmap-extra-value.types.js';
import type { HeatmapPdfContentInput } from '../types/heatmap-pdf-content-input.types.js';

function toCellText(cell: HeatmapCell | undefined): string {
  if (!cell || cell.isEmpty) return '';
  return HEATMAP_PDF_TEXT.cell(cell.count ?? 0, cell.percentage ?? 0);
}

function toCellFill(cell: HeatmapCell | undefined): string | undefined {
  if (!cell || cell.isEmpty) return undefined;
  const percentage = cell.percentage ?? 0;
  return HEATMAP_PDF_TONES.find((tone) => percentage >= tone.min)?.fill;
}

function toExtraText(value: HeatmapExtraValue | undefined): string {
  if (!value) return '';
  if (value.badgeText) return value.badgeText;
  if (value.percentage !== undefined) return `${value.percentage}%`;
  return value.count !== undefined ? String(value.count) : '';
}

export function buildHeatmapPdfContent({
  heatmap,
  filters,
  generatedBy,
  generatedAt,
}: HeatmapPdfContentInput): ReportPdfContent {
  const extras = heatmap.extraColumnsConfig ?? [];
  const valueColumnCount = Math.max(heatmap.columns.length + extras.length, 1);
  const valueWidth =
    (HEATMAP_PDF_TABLE_WIDTH - HEATMAP_PDF_SKILL_COLUMN_WIDTH) /
    valueColumnCount;
  const findCell = (cells: HeatmapCell[], columnId: string) =>
    cells.find((cell) => cell.columnId === columnId);

  return {
    title: HEATMAP_PDF_TITLES[heatmap.heatmapType],
    subtitle: HEATMAP_PDF_TEXT.base(heatmap.baseCount, heatmap.baseLabel),
    generatedBy,
    generatedAt,
    filters,
    columns: [
      { label: HEATMAP_PDF_TEXT.skillColumn, width: HEATMAP_PDF_SKILL_COLUMN_WIDTH },
      ...heatmap.columns.map((column) => ({ label: column.label, width: valueWidth })),
      ...extras.map((extra) => ({ label: extra.label, width: valueWidth })),
    ],
    rows: heatmap.rows.map((row) => [
      row.skillName,
      ...heatmap.columns.map((column) => toCellText(findCell(row.cells, column.id))),
      ...extras.map((extra) => toExtraText(row.extraValues?.[extra.id])),
    ]),
    cellFills: heatmap.rows.map((row) => [
      undefined,
      ...heatmap.columns.map((column) => toCellFill(findCell(row.cells, column.id))),
      ...extras.map(() => undefined),
    ]),
    totalLabel: HEATMAP_PDF_TEXT.totalRows(heatmap.rows.length),
  };
}
