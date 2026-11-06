import type { SurveySummary } from "../types/survey.types";
import { matchesSurveyYear } from "./survey-academic-periods";

export function filterSurveys(surveys: readonly SurveySummary[], creatorEmail: string, academicPeriod?: string): SurveySummary[] {
  const search = creatorEmail.trim().toLowerCase();

  return surveys.filter((survey) => {
    const matchesCreator = !search || (survey.createdBy?.email ?? "").toLowerCase().includes(search);
    const matchesPeriod = !academicPeriod || matchesSurveyYear(survey.academicPeriod, academicPeriod);
    return matchesCreator && matchesPeriod;
  });
}
