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
  targetAudienceRequired: "El público objetivo es obligatorio",
  academicPeriodRequired: "La gestión es obligatoria",
  opensAtRequired: "La fecha de apertura es obligatoria",
  closesAtRequired: "La fecha de cierre es obligatoria",
  questionsRequired: "La encuesta debe tener al menos una pregunta",
  statementRequired: "El enunciado de la pregunta es obligatorio",
  draftNeedsTitle: "Ingrese un título de al menos 5 caracteres para guardar el borrador",
  saveError: "No se pudo guardar la encuesta. Inténtalo de nuevo.",
  offlineError: "Sin conexión a internet. Verifique su red e inténtelo de nuevo.",
  careersLoadError: "No se pudieron cargar las carreras",
  surveysLoadError: "No se pudieron cargar las encuestas.",
  surveysEmpty: "Todavía no se creó ninguna encuesta.",
  surveysLoading: "Cargando encuestas...",
  surveyLoadError: "No se pudo cargar la encuesta.",
  draftUpdated: "Borrador actualizado",
  readOnlyNotice: "Esta encuesta ya fue publicada. Para corregirla, inhabilítela y vuelva a editarla como borrador.",
  readOnlyWithResponsesNotice: "Esta encuesta ya tiene respuestas registradas, por lo que no se puede inhabilitar ni editar.",
  unpublishDialogTitle: "¿Inhabilitar encuesta?",
  unpublishDialogDescription:
    "La encuesta dejará de estar visible para los destinatarios y volverá a estado borrador para que pueda corregirla y publicarla nuevamente.",
  unpublishSuccess: "Encuesta inhabilitada. Ahora puede editarla como borrador.",
  unpublishError: "No se pudo inhabilitar la encuesta. Inténtalo de nuevo.",
  previewNotice: "Vista previa: así verán la encuesta sus destinatarios. Las respuestas no se registran.",
  publishDialogTitle: "¿Publicar encuesta?",
  publishDialogDescription:
    "Una vez publicada, será visible para el público y la carrera seleccionados durante su vigencia. Para corregirla deberá inhabilitarla antes de recibir respuestas.",
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
  targetAudience: "Dirigido a",
  academicPeriod: "Gestión",
  opensAt: "Fecha de apertura",
  closesAt: "Fecha de cierre",
  questions: "Preguntas",
} as const;

export const SURVEY_FIELD_ERROR_DEPENDENCIES: Readonly<Record<SurveyFieldName, readonly string[]>> = {
  title: ["title"],
  description: ["description"],
  careerId: ["careerId", "title"],
  targetAudience: ["targetAudience"],
  academicPeriod: ["academicPeriod", "title"],
  opensAt: ["opensAt", "closesAt"],
  closesAt: ["closesAt", "opensAt"],
};
