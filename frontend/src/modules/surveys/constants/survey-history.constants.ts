import type { SurveyHistoryStatus } from "../types/survey-history.types";

export const SURVEY_HISTORY_PATH = "/backoffice/surveys/history";

export const SURVEY_HISTORY_PAGE_TITLE = "Historial de Encuestas";
export const SURVEY_HISTORY_PAGE_DESCRIPTION = "Administra las encuestas de empleabilidad creadas por administradores";

export const SURVEY_HISTORY_PAGE_SIZE = 10;
export const SURVEY_HISTORY_COLUMN_COUNT = 6;
export const SURVEY_HISTORY_ITEM_LABEL = "encuestas";
export const SURVEY_HISTORY_MOCK_DELAY_MS = 400;

export const SURVEY_HISTORY_FILTERS_LABEL = "Filtros del historial de encuestas";
export const SURVEY_HISTORY_SEARCH_LABEL = "Buscar por correo electrónico del administrador...";
export const SURVEY_HISTORY_PERIOD_LABEL = "Gestión académica";

export const SURVEY_HISTORY_EMPTY_MESSAGE = "No hay encuestas registradas para este filtro.";
export const SURVEY_HISTORY_NO_RESULTS_MESSAGE = "No se encontró ninguna encuesta con el correo";
export const SURVEY_HISTORY_LOAD_ERROR_MESSAGE = "No se pudo cargar el historial de encuestas.";
export const SURVEY_HISTORY_CSV_FALLBACK_NAME = "historial-encuestas.csv";

export const SURVEY_HISTORY_COLUMNS = [
  "Título de Encuesta",
  "Administrador Creador",
  "Gestión",
  "Fecha de Creación",
  "Estado",
  "Acciones",
] as const;

export const SURVEY_HISTORY_CSV_HEADERS = [
  "Título de Encuesta",
  "Administrador Creador",
  "Correo del Administrador",
  "Gestión",
  "Fecha de Creación",
  "Estado",
] as const;

export const SURVEY_HISTORY_STATUS_LABELS: Readonly<Record<SurveyHistoryStatus, string>> = {
  active: "Activa",
  inactive: "Inactiva",
};

export const SURVEY_HISTORY_STATUS_CLASSES: Readonly<Record<SurveyHistoryStatus, string>> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-border bg-surface-soft text-ink-soft",
};

export const SURVEY_HISTORY_TEXT = {
  viewDetails: "Ver detalles",
  viewStatistics: "Ver estadísticas",
  creator: "Administrador creador",
  academicPeriod: "Gestión",
  career: "Carrera",
  allCareers: "Todas las carreras",
  createdAt: "Fecha de creación",
  status: "Estado",
  questions: "Preguntas",
  responses: "Respuestas recibidas",
  close: "Cerrar",
} as const;

export const SURVEY_HISTORY_REFRESH_BUTTON_CLASSES =
  "h-10 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-brand-hover";

export const SURVEY_HISTORY_ACTION_BUTTON_CLASSES =
  "size-9 rounded-md border-border bg-interaction text-accent hover:bg-accent/10 hover:text-accent";
