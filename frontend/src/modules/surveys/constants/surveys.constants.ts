import type { SurveyStatus } from "../types/survey.types";

export const SURVEYS_PAGE_SIZE = 10;
export const SURVEYS_COLUMN_COUNT = 6;

export const SURVEY_STATISTICS_BASE_PATH = "/backoffice/surveys/statistics";

export const SURVEYS_LOAD_ERROR_MESSAGE = "No se pudieron cargar las encuestas.";
export const SURVEYS_EMPTY_MESSAGE = "No hay encuestas registradas para la gestión seleccionada.";
export const SURVEYS_SEARCH_NO_RESULTS_MESSAGE = "No se encontró ninguna encuesta del administrador con ese correo";
export const STATISTICS_UNAVAILABLE_LABEL = "Sin estadísticas";
export const SURVEYS_PERIOD_FILTER_LABEL = "Gestión académica";
export const SURVEYS_PERIOD_FILTER_ALL_LABEL = "Todas";

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
  CLOSED: "Cerrada",
};

export const SURVEY_STATUS_BADGE_CLASSES: Record<SurveyStatus, string> = {
  DRAFT: "border-border bg-surface-soft text-text-secondary",
  PUBLISHED: "border-primary/30 bg-primary/10 text-primary",
  CLOSED: "border-border-strong bg-muted text-ink-soft",
};

export const STATISTICS_AVAILABLE_STATUSES: SurveyStatus[] = ["PUBLISHED", "CLOSED"];
