export const SURVEYS_PATH = "/backoffice/surveys";
export const CREATE_SURVEY_PATH = "/backoffice/surveys/create";
export const getSurveyDetailPath = (id: string) => `${SURVEYS_PATH}/${id}`;
export const getSurveyStatisticsPath = (id: string) => `${SURVEYS_PATH}/statistics/${id}`;

export const SURVEYS_PAGE_TITLE = "Historial de Encuestas";
export const SURVEYS_PAGE_DESCRIPTION = "Administra las encuestas de empleabilidad y consulta las estadísticas de cada una.";
export const CREATE_SURVEY_ACTION_LABEL = "Crear encuesta";
export const REFRESH_SURVEYS_LABEL = "Actualizar";
export const CREATOR_SEARCH_LABEL = "Buscar por correo electrónico del administrador";
export const ACADEMIC_PERIOD_FILTER_LABEL = "Gestión académica";
export const ALL_ACADEMIC_PERIODS_LABEL = "Todos";
export const SURVEYS_FILTERED_EMPTY = "No hay encuestas que coincidan con los filtros.";

export const SURVEY_ROW_ACTION_LABELS = {
  edit: (title: string) => `Editar ${title}`,
  view: (title: string) => `Ver ${title}`,
  statistics: (title: string) => `Ver estadísticas de ${title}`,
  statisticsUnavailable: "Las estadísticas estarán disponibles cuando la encuesta se publique",
} as const;

export const SURVEYS_TABLE_COLUMNS = [
  "Título de encuesta",
  "Administrador creador",
  "Gestión",
  "Fecha de creación",
  "Estado",
  "Acciones",
] as const;
