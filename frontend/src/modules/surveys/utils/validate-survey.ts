import { SURVEY_LIMITS, SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_ERROR_SUMMARIES, SURVEY_FIELD_LABELS, SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import type { SurveyBuilderState } from "../types/survey-builder.types";
import type { SurveyErrorMap, SurveyValidationError } from "../types/survey-validation.types";
import { hasDuplicatedLabels } from "./find-duplicated-labels";

type SurveyValidationInput = Pick<
  SurveyBuilderState,
  "title" | "careerId" | "academicPeriod" | "opensAt" | "closesAt" | "questions"
>;

function getTitleError(title: string): SurveyValidationError | null {
  const trimmed = (title ?? "").trim();
  const label = SURVEY_FIELD_LABELS.title;
  if (!trimmed) {
    return { path: "title", label, message: SURVEY_MESSAGES.titleRequired, summary: SURVEY_ERROR_SUMMARIES.titleRequired };
  }
  if (trimmed.length < SURVEY_LIMITS.titleMin) {
    return { path: "title", label, message: SURVEY_MESSAGES.titleTooShort, summary: SURVEY_ERROR_SUMMARIES.titleTooShort };
  }
  return null;
}

export function validateDraft(survey: Pick<SurveyBuilderState, "title">): SurveyValidationError[] {
  const titleError = getTitleError(survey.title);
  return titleError ? [titleError] : [];
}

export function validateSurvey(survey: SurveyValidationInput, today: string): SurveyValidationError[] {
  const errors: SurveyValidationError[] = [];
  const titleError = getTitleError(survey.title);
  if (titleError) errors.push(titleError);

  const requiredFields = [
    ["careerId", SURVEY_MESSAGES.careerRequired],
    ["academicPeriod", SURVEY_MESSAGES.academicPeriodRequired],
    ["opensAt", SURVEY_MESSAGES.opensAtRequired],
    ["closesAt", SURVEY_MESSAGES.closesAtRequired],
  ] as const;

  for (const [field, message] of requiredFields) {
    if (!survey[field]) {
      errors.push({ path: field, label: SURVEY_FIELD_LABELS[field], message, summary: SURVEY_ERROR_SUMMARIES.required });
    }
  }

  if (survey.opensAt && survey.opensAt < today) {
    errors.push({
      path: "opensAt",
      label: SURVEY_FIELD_LABELS.opensAt,
      message: SURVEY_MESSAGES.opensInThePast,
      summary: SURVEY_ERROR_SUMMARIES.opensInThePast,
    });
  }

  if (survey.opensAt && survey.closesAt && survey.closesAt <= survey.opensAt) {
    errors.push({
      path: "closesAt",
      label: SURVEY_FIELD_LABELS.closesAt,
      message: SURVEY_MESSAGES.closesBeforeOpens,
      summary: SURVEY_ERROR_SUMMARIES.closesBeforeOpens,
    });
  }

  const questions = survey.questions ?? [];
  if (questions.length === 0) {
    errors.push({
      path: "questions",
      label: SURVEY_FIELD_LABELS.questions,
      message: SURVEY_MESSAGES.questionsRequired,
      summary: SURVEY_ERROR_SUMMARIES.questionsRequired,
    });
  }

  questions.forEach((question, index) => {
    const label = SURVEY_TEXT.questionLabel(index + 1);

    if (!(question.statement ?? "").trim()) {
      errors.push({
        path: `questions.${index}.statement`,
        label,
        message: SURVEY_MESSAGES.statementRequired,
        summary: SURVEY_ERROR_SUMMARIES.statementRequired,
      });
    }

    const labels = (question.options ?? []).map((option) => (option.label ?? "").trim()).filter(Boolean);
    if (labels.length < SURVEY_LIMITS.minOptions) {
      errors.push({
        path: `questions.${index}.options`,
        label,
        message: SURVEY_MESSAGES.optionsTooFew,
        summary: SURVEY_ERROR_SUMMARIES.optionsTooFew,
      });
    } else if (hasDuplicatedLabels(labels)) {
      errors.push({
        path: `questions.${index}.options`,
        label,
        message: SURVEY_MESSAGES.optionsDuplicated,
        summary: SURVEY_ERROR_SUMMARIES.optionsDuplicated,
      });
    }
  });

  return errors;
}

export function toErrorMap(errors: readonly SurveyValidationError[]): SurveyErrorMap {
  const map: Record<string, string> = {};
  for (const error of errors) {
    if (!(error.path in map)) map[error.path] = error.message;
  }
  return map;
}

export function getQuestionErrorPaths(index: number): string[] {
  return [`questions.${index}.statement`, `questions.${index}.options`];
}
