import {
  SURVEY_ACADEMIC_PERIOD_YEAR_PATTERN,
  SURVEY_ALL_ACADEMIC_PERIODS,
} from '../constants/survey.constants.js';
import type {
  GraduateProfile,
  SurveyAudience,
} from '../types/graduate-profile.type.js';

export function isSurveyForGraduate(
  survey: SurveyAudience,
  graduate: GraduateProfile,
): boolean {
  const careerMatches = !survey.career || survey.career.id === graduate.careerId;
  const period = survey.academicPeriod?.trim();
  if (!period || period === SURVEY_ALL_ACADEMIC_PERIODS) return careerMatches;

  const surveyYear = SURVEY_ACADEMIC_PERIOD_YEAR_PATTERN.exec(period)?.[1];
  return careerMatches && surveyYear === String(graduate.graduationYear);
}
