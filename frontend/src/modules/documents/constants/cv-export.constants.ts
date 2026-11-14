import type { CvExportSectionKey } from "../types/cv-export-section-key.types";
import type { CvExportSectionOption } from "../types/cv-export-section-option.types";
import type { CvExportSections } from "../types/cv-export-sections.types";

export const CV_EXPORT_FILE_PREFIX = "CV";

export const CV_EXPORT_FILE_EXTENSION = ".pdf";

export const CV_EXPORT_ERROR_MESSAGES_BY_STATUS: Record<number, string> = {
  401: "Tu sesión no es válida. Inicia sesión nuevamente.",
  403: "Tu cuenta no tiene permiso para generar un CV.",
  404: "No encontramos tu perfil. Completa tus datos e intenta de nuevo.",
};

export const CV_EXPORT_SECTION_OPTIONS: CvExportSectionOption[] = [
  { key: "includeContactInfo", label: "Datos personales y de contacto" },
  { key: "includeSummary", label: "Presentación profesional" },
  { key: "includeWorkExperience", label: "Experiencia laboral" },
  { key: "includeEducation", label: "Formación académica" },
  { key: "includeCertifications", label: "Certificaciones" },
  { key: "includeProjects", label: "Proyectos de código y portafolio (GitHub / GitLab)" },
];

export const CV_EXPORT_DEFAULT_SECTIONS: CvExportSections = {
  includeContactInfo: true,
  includeSummary: true,
  includeWorkExperience: true,
  includeEducation: true,
  includeCertifications: true,
  includeProjects: true,
};

export const CV_EXPORT_REPOSITORIES_SECTION_KEY: CvExportSectionKey = "includeProjects";

export const CV_EXPORT_PORTFOLIO_COUNT_QUERY_KEY = ["documents", "cv-export", "portfolio-count"] as const;
