import type { SurveyBuilderState } from "../types/survey-builder.types";
import type { CreateSurveyPayload, SurveyStatus } from "../types/survey.types";
import { toClosesAtIso, toOpensAtIso } from "./survey-dates";

export function toCreateSurveyPayload(survey: SurveyBuilderState, status: SurveyStatus): CreateSurveyPayload {
  const description = (survey.description ?? "").trim();

  return {
    title: (survey.title ?? "").trim(),
    description: description || undefined,
    careerId: survey.careerId || undefined,
    academicPeriod: survey.academicPeriod || undefined,
    opensAt: survey.opensAt ? toOpensAtIso(survey.opensAt) : undefined,
    closesAt: survey.closesAt ? toClosesAtIso(survey.closesAt) : undefined,
    status,
    questions: (survey.questions ?? []).map((question) => ({
      statement: (question.statement ?? "").trim(),
      type: question.type,
      isRequired: question.isRequired,
      options: (question.options ?? [])
        .map((option) => ({ label: (option.label ?? "").trim() }))
        .filter(({ label }) => label.length > 0),
    })),
  };
}
