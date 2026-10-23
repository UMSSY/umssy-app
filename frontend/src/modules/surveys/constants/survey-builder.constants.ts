import { CircleDot, SquareCheck } from "lucide-react";
import type { QuestionTypeOption } from "../types/question-type-option.types";
import type { QuestionType, SurveyStatus } from "../types/survey.types";

export const SURVEY_LIMITS = {
  titleMin: 5,
  titleMax: 150,
  descriptionMax: 500,
  statementMax: 250,
  optionMax: 100,
  minOptions: 2,
} as const;

export const DEFAULT_QUESTION_TYPE: QuestionType = "single_choice";
export const DEFAULT_OPTION_COUNT = 2;

export const QUESTION_TYPE_OPTIONS: readonly QuestionTypeOption[] = [
  { value: "single_choice", label: "Opción única", icon: CircleDot },
  { value: "multiple_choice", label: "Opción múltiple", icon: SquareCheck },
];

export const QUESTION_TYPE_ITEMS = QUESTION_TYPE_OPTIONS.map(({ value, label }) => ({ value, label }));

export const QUESTION_TYPE_LABELS: Readonly<Record<QuestionType, string>> = {
  single_choice: "Opción única",
  multiple_choice: "Opción múltiple",
};

export const SURVEY_STATUS_LABELS: Readonly<Record<SurveyStatus, string>> = {
  draft: "Borrador",
  published: "Publicada",
};

export const SURVEY_TEXT = {
  pageTitle: "Crear encuesta",
  draftBadge: "Borrador",
  titlePlaceholder: "Título de la encuesta",
  descriptionPlaceholder: "Descripción del formulario",
  untitledQuestion: "Pregunta sin título",
  untitledSurvey: "Encuesta sin título",
  addOption: "Añadir opción",
  addQuestion: "Añadir pregunta",
  required: "Obligatoria",
  selectCareer: "Seleccione una carrera",
  loading: "Cargando...",
  selectPeriod: "Seleccione la gestión",
  selectDate: "dd/mm/aaaa",
  cancel: "Cancelar",
  preview: "Vista previa",
  saveDraft: "Guardar borrador",
  publish: "Publicar encuesta",
  confirmPublish: "Publicar",
  publishing: "Publicando...",
  saving: "Guardando...",
  discard: "Descartar",
  keepEditing: "Seguir editando",
  close: "Cerrar",
  optionPlaceholder: (position: number) => `Opción ${position}`,
  optionsCount: (count: number) => `${count} ${count === 1 ? "opción" : "opciones"}`,
  questionsSummary: (total: number, required: number) => `${total} (${required} ${required === 1 ? "obligatoria" : "obligatorias"})`,
  questionLabel: (position: number) => `Pregunta ${position}`,
} as const;

export const SURVEY_SUMMARY_LABELS = {
  survey: "Encuesta",
  career: "Dirigida a",
  schedule: "Vigencia",
  questions: "Preguntas",
} as const;

export const SURVEY_ARIA = {
  dragHandle: (position: number) =>
    `Reordenar pregunta ${position}. Arrastre o use las flechas arriba y abajo del teclado`,
  duplicate: "Duplicar pregunta",
  remove: "Eliminar pregunta",
  removeOption: (position: number) => `Eliminar opción ${position}`,
  addQuestion: "Añadir pregunta",
  preview: "Vista previa",
  questionType: "Tipo de pregunta",
  statement: (position: number) => `Enunciado de la pregunta ${position}`,
  option: (position: number) => `Texto de la opción ${position}`,
  toolbar: "Acciones de la pregunta",
  editQuestion: (position: number) => `Editar pregunta ${position}`,
  pickDate: (label: string) => `Elegir ${label.toLowerCase()}`,
} as const;
