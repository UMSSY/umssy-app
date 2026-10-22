import {
  SURVEY_FORM_MESSAGES as MESSAGES,
  SURVEY_MAX_OPTIONS,
  SURVEY_MAX_QUESTIONS,
  SURVEY_MIN_OPTIONS,
} from "../constants/survey-form.constants";
import type { SurveyInput, SurveyQuestionInput } from "../types/survey.types";
import type { SurveyValidationError, SurveyValidationMode } from "../types/survey-validation.types";

const TODAY_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz" });

// Fecha de hoy en Bolivia con formato YYYY-MM-DD, el mismo de los date pickers.
export function getTodayIsoDate(now = new Date()): string {
  return TODAY_FORMATTER.format(now);
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function buildError(field: string, label: string, message: string): SurveyValidationError {
  return { field, message, summary: `${label}: ${lowerFirst(message)}.` };
}

function validateQuestion(question: SurveyQuestionInput, index: number): SurveyValidationError[] {
  const errors: SurveyValidationError[] = [];
  const label = `Pregunta ${index + 1}`;
  const options = question.options.map((option) => option.trim());
  const filledOptions = options.filter(Boolean);

  if (!question.text.trim()) {
    errors.push(buildError(`questions.${index}.text`, label, MESSAGES.questionTextRequired));
  }
  if (options.length < SURVEY_MIN_OPTIONS) {
    errors.push(buildError(`questions.${index}.options`, label, MESSAGES.optionsMin));
  } else if (options.length > SURVEY_MAX_OPTIONS) {
    errors.push(buildError(`questions.${index}.options`, label, MESSAGES.optionsMax));
  } else if (filledOptions.length < options.length) {
    errors.push(buildError(`questions.${index}.options`, label, MESSAGES.optionTextRequired));
  } else if (new Set(options.map((option) => option.toLowerCase())).size < options.length) {
    errors.push(buildError(`questions.${index}.options`, label, MESSAGES.optionsDuplicated));
  }

  return errors;
}

// Reglas de negocio de una encuesta. Son las mismas que deberá aplicar el backend antes de guardar.
export function validateSurveyInput(
  input: SurveyInput,
  mode: SurveyValidationMode,
  today = getTodayIsoDate(),
): SurveyValidationError[] {
  const errors: SurveyValidationError[] = [];
  const isPublishing = mode === "publish";

  if (!input.title.trim()) {
    errors.push(buildError("title", "Título", MESSAGES.titleRequired));
  }

  if (isPublishing && !input.period) {
    errors.push(buildError("period", "Gestión", MESSAGES.periodRequired));
  }

  if (isPublishing && !input.opensAt) {
    errors.push(buildError("opensAt", "Fecha de apertura", MESSAGES.opensAtRequired));
  } else if (isPublishing && input.opensAt < today) {
    errors.push(buildError("opensAt", "Fecha de apertura", MESSAGES.opensAtInPast));
  }

  if (isPublishing && !input.closesAt) {
    errors.push(buildError("closesAt", "Fecha de cierre", MESSAGES.closesAtRequired));
  } else if (input.opensAt && input.closesAt && input.closesAt <= input.opensAt) {
    errors.push(buildError("closesAt", "Fecha de cierre", MESSAGES.closesAtBeforeOpensAt));
  }

  if (input.questions.length > SURVEY_MAX_QUESTIONS) {
    errors.push(buildError("questions", "Preguntas", MESSAGES.questionsLimit));
  }

  if (isPublishing) {
    if (input.questions.length === 0) {
      errors.push(buildError("questions", "Preguntas", MESSAGES.questionsRequired));
    }
    input.questions.forEach((question, index) => errors.push(...validateQuestion(question, index)));
  }

  return errors;
}
