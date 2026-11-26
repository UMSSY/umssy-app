export const SURVEYS_PATH = "/backoffice/surveys";
export const CREATE_SURVEY_PATH = "/backoffice/surveys/create";
export const getSurveyDetailPath = (id: string) => `${SURVEYS_PATH}/${id}`;
export const getSurveyStatisticsPath = (id: string) => `${SURVEYS_PATH}/statistics/${id}`;

export const SURVEY_ROW_ACTION_LABELS = {
  edit: (title: string) => `Editar ${title}`,
  view: (title: string) => `Ver ${title}`,
  statistics: (title: string) => `Ver estadísticas de ${title}`,
  statisticsUnavailable: "Las estadísticas estarán disponibles cuando la encuesta se publique",
  unpublish: (title: string) => `Inhabilitar ${title}`,
  unpublishUnavailable: "No se puede inhabilitar una encuesta que ya tiene respuestas registradas",
} as const;

export const SURVEYS_TABLE_COLUMNS = [
  "Título de encuesta",
  "Administrador creador",
  "Gestión",
  "Fecha de creación",
  "Estado",
  "Acciones",
] as const;
