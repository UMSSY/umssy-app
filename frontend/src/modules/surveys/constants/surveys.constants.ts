import type { SurveyStatus } from "../types/survey.types";

export const SURVEYS_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const SURVEYS_DEFAULT_PAGE_SIZE = SURVEYS_PAGE_SIZE_OPTIONS[0];
export const SURVEYS_COLUMN_COUNT = 6;

export const SURVEYS_BASE_PATH = "/backoffice/surveys";
export const SURVEY_CREATE_PATH = `${SURVEYS_BASE_PATH}/create`;
export const SURVEY_RESUME_PATH = `${SURVEY_CREATE_PATH}?resume=1`;
export const getSurveyStatisticsPath = (id: string) => `${SURVEYS_BASE_PATH}/statistics/${id}`;
export const getSurveyEditPath = (id: string) => `${SURVEYS_BASE_PATH}/${id}/edit`;

export const SURVEY_FORM_DRAFT_STORAGE_KEY = "umssy.surveys.form-draft";

export const SURVEYS_LOAD_ERROR_MESSAGE = "No se pudieron cargar las encuestas.";
export const SURVEYS_EMPTY_MESSAGE = "No hay encuestas registradas para la gestión seleccionada.";
export const SURVEYS_SEARCH_NO_RESULTS_MESSAGE = "No se encontró ninguna encuesta del administrador con ese correo";
export const SURVEYS_SEARCH_PLACEHOLDER = "Buscar por correo electrónico del administrador...";
export const SURVEYS_PERIOD_FILTER_LABEL = "Gestión académica";
export const SURVEYS_PERIOD_FILTER_ALL_LABEL = "Todos";
export const SURVEY_STATUS_CHANGE_ERROR_MESSAGE = "No se pudo cambiar el estado de la encuesta.";
export const NO_PERIOD_LABEL = "Sin gestión";

export const SURVEY_TOAST_OPTIONS = { closeButton: true, richColors: true } as const;

export const SURVEY_STATUS_CHANGE_SUCCESS_MESSAGES: Record<"PUBLISHED" | "CLOSED", string> = {
  PUBLISHED: "La encuesta ahora está activa",
  CLOSED: "La encuesta ahora está inactiva",
};

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Activa",
  CLOSED: "Inactiva",
};

export const SURVEY_STATUS_BADGE_CLASSES: Record<SurveyStatus, string> = {
  DRAFT: "border-gold/50 bg-gold/15 text-ink-soft",
  PUBLISHED: "border-primary/30 bg-primary/10 text-primary",
  CLOSED: "border-border-strong bg-muted text-ink-soft",
};
