import {
  SurveyStatus,
  type SurveyDisplayStatusValue,
} from '../types/survey.enum.js';

export function resolveSurveyStatus(
  status: string,
  closesAt: Date | null,
  now: Date,
): SurveyDisplayStatusValue {
  if (status === SurveyStatus.DRAFT) return 'draft';
  if (closesAt && closesAt.getTime() < now.getTime()) return 'closed';
  return 'published';
}
