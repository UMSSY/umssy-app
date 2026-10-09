import type { ReportUserType } from './report-user.types.js';

// Mismos códigos que usa el frontend (modules/reports/types).
// REGISTERED_USERS es la exportación de usuarios registrados sin filtro de tipo.
export const REPORT_TYPES = [
  'REGISTERED_USERS',
  'STUDENTS',
  'DEGREE_HOLDERS',
  'MENTORS',
  'COMPANIES',
  'ADMINS',
  'REJECTED_USERS',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

// Tipo de reporte que se registra al exportar usuarios registrados filtrados por tipo de usuario.
export const REGISTERED_USERS_REPORT_TYPES: Record<ReportUserType, ReportType> =
  {
    STUDENT: 'STUDENTS',
    DEGREE_HOLDER: 'DEGREE_HOLDERS',
    MENTOR: 'MENTORS',
    COMPANY: 'COMPANIES',
    ADMIN: 'ADMINS',
  };

export interface GeneratedReport {
  readonly id: string;
  readonly fileName: string;
  readonly reportType: ReportType;
  readonly generatedAt: string;
}

// Datos que entrega la exportación; el id y la fecha los asigna el servidor.
export type RegisterGeneratedReportInput = Pick<
  GeneratedReport,
  'fileName' | 'reportType'
>;
