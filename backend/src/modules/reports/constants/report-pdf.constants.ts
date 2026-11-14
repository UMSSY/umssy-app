import type { ReportPdfDefinition } from '../types/report-pdf.types.js';

export const REPORT_PDF_PAGE = {
  width: 841.89,
  height: 595.28,
  margin: 35,
  footerLimit: 45,
} as const;

export const REPORT_PDF_COLORS = {
  navy: '#08365c',
  text: '#1f262e',
  muted: '#5a6673',
  white: '#ffffff',
  cardBackground: '#f5f7fa',
  border: '#d9e0e8',
  pillBackground: '#ebedf2',
  rowStripe: '#f5f7fa',
} as const;

export const REPORT_PDF_TEXT = {
  universityName: 'Universidad Mayor de San Simón',
  universitySubtitle: 'Ingeniería de Sistemas · Acreditación y comunidad',
  brand: 'UMSSY',
  generatedAtCard: 'FECHA DE GENERACIÓN',
  generatedByCard: 'GENERADO POR',
  totalCard: 'TOTAL DE REGISTROS',
  filtersLabel: 'Filtros aplicados:',
  emptyTable: 'No hay resultados disponibles para exportar.',
  allUserTypes: 'Todos',
  allDates: 'Todas las fechas',
  emptySearch: 'ninguna',
  userTypeFilter: 'Tipo de usuario',
  searchFilter: 'Búsqueda',
  footer: (generatedAt: string) => `UMSSY · Reporte generado el ${generatedAt}`,
  pageLabel: (page: number, total: number) => `Página ${page} de ${total}`,
  totalRecords: (total: number) => `${total} ${total === 1 ? 'usuario' : 'usuarios'}`,
  author: (fullName: string, role: string) => `${fullName} (${role})`,
} as const;

export const REPORT_PDF_BASE_COLUMNS = [
  { label: 'Nombre', width: 165 },
  { label: 'Correo', width: 200 },
  { label: 'Tipo de usuario', width: 105 },
  { label: 'Documento', width: 182 },
] as const;

export const REPORT_PDF_DATE_COLUMN_WIDTH = 120;

export const REGISTERED_USERS_PDF: ReportPdfDefinition = {
  title: 'Reporte de usuarios aceptados',
  subtitle: 'Personas con acceso aprobado a la plataforma',
  dateColumnLabel: 'Fecha de aprobación',
  dateFilterLabel: 'Aprobados desde',
};

export const REJECTED_USERS_PDF: ReportPdfDefinition = {
  title: 'Reporte de usuarios rechazados',
  subtitle: 'Personas con solicitud de acceso rechazada',
  dateColumnLabel: 'Fecha de rechazo',
  dateFilterLabel: 'Rechazados desde',
};

export const PDF_EXTENSION = 'pdf';
