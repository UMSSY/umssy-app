import type { SurveyFieldName } from "../types/survey-builder.types";
import { SURVEY_LIMITS } from "./survey-builder.constants";

export const SURVEY_MESSAGES = {
  publishSuccess: "Encuesta creada con éxito",
  draftSaved: "Borrador guardado",
  validationAlertTitle: "Complete los campos obligatorios antes de publicar",
  duplicatedTitle: "Ya existe una encuesta con este título para la carrera y gestión seleccionadas",
  closesBeforeOpens: "La fecha de cierre debe ser posterior a la fecha de apertura",
  opensInThePast: "La fecha de apertura no puede ser anterior a la fecha actual",
  optionsTooFew: "La pregunta debe tener al menos 2 opciones",
  optionsDuplicated: "Las opciones de una pregunta no pueden repetirse",
  titleRequired: "El título de la encuesta es obligatorio",
  titleTooShort: `El título debe tener al menos ${SURVEY_LIMITS.titleMin} caracteres`,
  careerRequired: "La carrera dirigida es obligatoria",
  academicPeriodRequired: "La gestión es obligatoria",
  opensAtRequired: "La fecha de apertura es obligatoria",
  closesAtRequired: "La fecha de cierre es obligatoria",
  questionsRequired: "La encuesta debe tener al menos una pregunta",
  statementRequired: "El enunciado de la pregunta es obligatorio",
  draftNeedsTitle: "Ingrese un título de al menos 5 caracteres para guardar el borrador",
  saveError: "No se pudo guardar la encuesta. Inténtalo de nuevo.",
  careersLoadError: "No se pudieron cargar las carreras",
  surveysLoadError: "No se pudieron cargar las encuestas.",
  surveysEmpty: "Todavía no se creó ninguna encuesta.",
  surveysLoading: "Cargando encuestas...",
  previewNotice: "Vista previa: así verá la encuesta el titulado. Las respuestas no se registran.",
  publishDialogTitle: "¿Publicar encuesta?",
  publishDialogDescription:
    "Una vez publicada, será visible para los titulados de la carrera seleccionada durante su vigencia y ya no se podrán editar sus preguntas ni opciones.",
  discardDialogTitle: "¿Descartar cambios?",
  discardDialogDescription: "Los cambios que realizó en la encuesta no se guardarán.",
} as const;

export const SURVEY_ERROR_SUMMARIES = {
  titleRequired: "es obligatorio.",
  titleTooShort: `debe tener al menos ${SURVEY_LIMITS.titleMin} caracteres.`,
  required: "es obligatoria.",
  closesBeforeOpens: "debe ser posterior a la fecha de apertura.",
  opensInThePast: "no puede ser anterior a la fecha actual.",
  questionsRequired: "agregue al menos una pregunta.",
  statementRequired: "el enunciado es obligatorio.",
  optionsTooFew: "debe tener al menos 2 opciones.",
  optionsDuplicated: "las opciones no pueden repetirse.",
} as const;

export const SURVEY_FIELD_LABELS = {
  title: "Título",
  description: "Descripción",
  careerId: "Carrera dirigida",
  academicPeriod: "Gestión",
  opensAt: "Fecha de apertura",
  closesAt: "Fecha de cierre",
  questions: "Preguntas",
} as const;

export const SURVEY_FIELD_ERROR_DEPENDENCIES: Readonly<Record<SurveyFieldName, readonly string[]>> = {
  title: ["title"],
  description: ["description"],
  careerId: ["careerId", "title"],
  academicPeriod: ["academicPeriod", "title"],
  opensAt: ["opensAt", "closesAt"],
  closesAt: ["closesAt", "opensAt"],
};
