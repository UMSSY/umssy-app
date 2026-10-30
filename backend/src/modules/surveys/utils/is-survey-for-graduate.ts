import {
  SURVEY_ACADEMIC_PERIOD_YEAR_PATTERN,
  SURVEY_ALL_ACADEMIC_PERIODS,
} from '../constants/survey.constants.js';
import { SURVEY_AUDIENCE_ROLES } from '../constants/surveys-access.constants.js';
import type {
  GraduateProfile,
  SurveyAudience,
} from '../types/graduate-profile.type.js';
import type { SurveyTargetAudience } from '../types/survey.enum.js';

export function getSurveyAudiencesForRoles(
  roles: readonly string[],
): SurveyTargetAudience[] {
  return (Object.keys(SURVEY_AUDIENCE_ROLES) as SurveyTargetAudience[]).filter(
    (audience) => SURVEY_AUDIENCE_ROLES[audience].some((role) => roles.includes(role)),
  );
}

export function isSurveyForGraduate(
  survey: SurveyAudience,
  graduate: GraduateProfile | null,
  roles: readonly string[],
): boolean {
  const audience = survey.targetAudience;
  if (!audience || !getSurveyAudiencesForRoles(roles).includes(audience)) return false;

  const careerMatches = !survey.career || survey.career.id === graduate?.careerId;
  const period = survey.academicPeriod?.trim();
  if (!period || period === SURVEY_ALL_ACADEMIC_PERIODS) return careerMatches;

  const surveyYear = SURVEY_ACADEMIC_PERIOD_YEAR_PATTERN.exec(period)?.[1];
  return careerMatches && !!graduate && surveyYear === String(graduate.graduationYear);
}
