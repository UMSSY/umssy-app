import type { SurveyQuestionInput, SurveyQuestionType } from "../types/survey.types";

export const SURVEY_TITLE_MAX_LENGTH = 120;
export const SURVEY_DESCRIPTION_MAX_LENGTH = 500;
export const SURVEY_QUESTION_MAX_LENGTH = 200;
export const SURVEY_OPTION_MAX_LENGTH = 100;
export const SURVEY_MIN_QUESTIONS = 1;
export const SURVEY_MAX_QUESTIONS = 20;
export const SURVEY_MIN_OPTIONS = 2;
export const SURVEY_MAX_OPTIONS = 10;

export const SURVEY_QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  SINGLE_CHOICE: "Opción única",
  MULTIPLE_CHOICE: "Opción múltiple",
  DROPDOWN: "Lista desplegable",
};

export const SURVEY_QUESTION_TYPES: SurveyQuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"];

export const ALL_CAREERS_LABEL = "Todas las carreras";

export const UNTITLED_QUESTION_PLACEHOLDER = "Pregunta sin título";

export function createDefaultQuestion(): SurveyQuestionInput {
  return { text: "", type: "SINGLE_CHOICE", isRequired: true, options: ["Opción 1", "Opción 2"] };
}

export const SURVEY_SAVE_MESSAGES = {
  published: "Encuesta creada con éxito",
  draftSaved: "Borrador guardado",
  noConnection: "Error 503/504: Sin conexión con el servidor",
  timeout: "Tiempo de solicitud excedido",
  fallback: "No se pudo guardar la encuesta. Intenta de nuevo.",
  errorBannerTitle: "Complete los campos obligatorios antes de publicar",
  notEditable: "Esta encuesta ya fue publicada y no se puede editar.",
  loadError: "No se pudo cargar la encuesta.",
} as const;

export const SURVEY_FORM_AUTOSAVE_DELAY_MS = 500;

export const SURVEY_FORM_MESSAGES = {
  titleRequired: "El título de la encuesta es obligatorio",
  periodRequired: "Selecciona la gestión de la encuesta",
  opensAtRequired: "La fecha de apertura es obligatoria",
  opensAtInPast: "La fecha de apertura no puede ser anterior a hoy",
  closesAtRequired: "La fecha de cierre es obligatoria",
  closesAtBeforeOpensAt: "La fecha de cierre debe ser posterior a la fecha de apertura",
  questionsRequired: "La encuesta debe tener al menos una pregunta",
  questionsLimit: `La encuesta no puede tener más de ${SURVEY_MAX_QUESTIONS} preguntas`,
  questionTextRequired: "El enunciado de la pregunta es obligatorio",
  optionsMin: `La pregunta debe tener al menos ${SURVEY_MIN_OPTIONS} opciones`,
  optionsMax: `La pregunta no puede tener más de ${SURVEY_MAX_OPTIONS} opciones`,
  optionTextRequired: "Las opciones no pueden estar vacías",
  optionsDuplicated: "Las opciones de una pregunta no pueden repetirse",
} as const;
