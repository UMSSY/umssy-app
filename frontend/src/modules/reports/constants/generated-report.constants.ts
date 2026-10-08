import type { ReportType } from "../types/generated-report.types";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  REGISTERED_USERS: "Lista de Usuarios",
  STUDENTS: "Estudiantes",
  DEGREE_HOLDERS: "Titulados",
  MENTORS: "Mentores",
  COMPANIES: "Empresas",
  ADMINS: "Administradores",
  REJECTED_USERS: "Rechazados",
};

// Opciones del filtro "Tipo de reporte", en el orden en que se muestran.
export const REPORT_TYPE_FILTER_OPTIONS: ReportType[] = [
  "REGISTERED_USERS",
  "STUDENTS",
  "DEGREE_HOLDERS",
  "MENTORS",
  "COMPANIES",
  "ADMINS",
  "REJECTED_USERS",
];
