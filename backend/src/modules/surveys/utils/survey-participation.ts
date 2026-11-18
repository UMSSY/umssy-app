import { SURVEY_AUDIENCE_ROLES } from '../constants/surveys-access.constants.js';
import {
  SURVEY_AUDIENCE_LABEL_FALLBACKS,
  SURVEY_AUDIENCE_LABELS,
} from '../constants/survey-participation.constants.js';
import {
  SURVEY_ACADEMIC_PERIOD_YEAR_PATTERN,
  SURVEY_ALL_ACADEMIC_PERIODS,
} from '../constants/survey.constants.js';
import type { SurveyAudienceFilter } from '../types/survey-audience-filter.type.js';
import type { SurveyParticipationTarget } from '../types/survey-participation-target.type.js';
import { SurveyStatus } from '../types/survey.enum.js';
import { toSurveyTargetAudienceValue } from './survey-catalog-values.js';

export function toTargetGraduationYear(
  academicPeriod: string | null,
): number | null {
  const period = academicPeriod?.trim();
  if (!period || period === SURVEY_ALL_ACADEMIC_PERIODS) return null;
  const year = SURVEY_ACADEMIC_PERIOD_YEAR_PATTERN.exec(period)?.[1];
  return year ? Number(year) : null;
}

export function buildSurveyAudienceFilter(
  target: SurveyParticipationTarget,
): SurveyAudienceFilter {
  const audience = toSurveyTargetAudienceValue(target.targetAudience);
  return {
    surveyId: target.id,
    roles: audience ? SURVEY_AUDIENCE_ROLES[audience] : [],
    careerId: target.career?.id ?? null,
    graduationYear: toTargetGraduationYear(target.academicPeriod),
  };
}

export function buildSurveyAudienceLabel(
  target: SurveyParticipationTarget,
): string {
  const audience = toSurveyTargetAudienceValue(target.targetAudience);
  const graduationYear = toTargetGraduationYear(target.academicPeriod);
  return [
    audience
      ? SURVEY_AUDIENCE_LABELS[audience]
      : SURVEY_AUDIENCE_LABEL_FALLBACKS.audience,
    target.career?.title ?? SURVEY_AUDIENCE_LABEL_FALLBACKS.career,
    graduationYear
      ? `Gestión ${graduationYear}`
      : SURVEY_AUDIENCE_LABEL_FALLBACKS.period,
  ].join(' · ');
}

export function computeResponseRate(responded: number, eligible: number) {
  if (eligible <= 0) return 0;
  return Math.min(100, Math.round((Math.max(responded, 0) / eligible) * 100));
}

export function isSurveyOpenForReminders(
  target: SurveyParticipationTarget,
  now: Date,
): boolean {
  return (
    target.status.title === SurveyStatus.PUBLISHED &&
    (!target.closesAt || target.closesAt.getTime() > now.getTime())
  );
}
