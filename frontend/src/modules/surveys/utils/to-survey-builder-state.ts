import type { SurveyBuilderState } from "../types/survey-builder.types";
import type { SurveyDetail } from "../types/survey.types";
import { toSurveyAcademicPeriod } from "./survey-academic-periods";
import { toDateValueFromIso } from "./survey-dates";

export function toSurveyBuilderState(survey: SurveyDetail): SurveyBuilderState {
  const questions = (survey.questions ?? []).map((question) => ({
    id: question.id,
    statement: question.statement ?? "",
    type: question.type,
    isRequired: question.isRequired,
    options: (question.options ?? []).map((option) => ({ id: option.id, label: option.label ?? "" })),
  }));

  return {
    title: survey.title ?? "",
    description: survey.description ?? "",
    careerId: survey.career?.id ?? "",
    academicPeriod: toSurveyAcademicPeriod(survey.academicPeriod),
    opensAt: toDateValueFromIso(survey.opensAt),
    closesAt: toDateValueFromIso(survey.closesAt),
    questions,
    activeQuestionId: questions[0]?.id ?? null,
    pendingFocus: null,
    isDirty: false,
  };
}
