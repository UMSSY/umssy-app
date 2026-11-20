import { REPORT_PDF_PAGE } from '../../reports/constants/report-pdf.constants.js';
import type { HeatmapType } from '../types/heatmap-type.types.js';

export const HEATMAP_EXPORT_FORMATS = ['pdf'] as const;

export const HEATMAP_PDF_TITLES: Record<HeatmapType, string> = {
  'skills-by-career': 'Mapa de calor de habilidades técnicas por carrera',
  'skills-by-salary': 'Habilidades NLP vs. rango salarial',
  employability: 'Empleabilidad y habilidades técnicas',
  'skills-by-experience': 'Habilidades vs. años de experiencia',
};

export const HEATMAP_PDF_TABLE_WIDTH =
  REPORT_PDF_PAGE.width - REPORT_PDF_PAGE.margin * 2;
export const HEATMAP_PDF_SKILL_COLUMN_WIDTH = 150;

export const HEATMAP_PDF_TONES = [
  { min: 75, fill: '#9db8d8' },
  { min: 50, fill: '#c3d4e8' },
  { min: 25, fill: '#dde7f2' },
  { min: 1, fill: '#eef3f9' },
] as const;

export const HEATMAP_PDF_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export const HEATMAP_PDF_TEXT = {
  skillColumn: 'Habilidad',
  careerFilter: 'Carrera',
  yearFilter: 'Gestión',
  monthFilter: 'Mes',
  rangeFilter: 'Rango',
  allCareers: 'Todas',
  allYears: 'Todas',
  allMonths: 'Todos',
  base: (count: number, label: string) => `Base: ${count} ${label}`,
  cell: (count: number, percentage: number) => `${count} (${percentage}%)`,
  totalRows: (total: number) =>
    `${total} ${total === 1 ? 'habilidad' : 'habilidades'}`,
  range: (from: string, to: string) => `${from} - ${to}`,
  fileName: (type: HeatmapType) => `mapa-calor-${type}.pdf`,
} as const;
