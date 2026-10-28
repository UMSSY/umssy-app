import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';
import type { SurveyScheduleError } from '../types/survey-schedule-error.type.js';

export function getScheduleError(
  opensAt: Date,
  closesAt: Date,
  now: Date,
): SurveyScheduleError | null {
  const openDate = toBoliviaTime(opensAt).date;
  const closeDate = toBoliviaTime(closesAt).date;
  const today = toBoliviaTime(now).date;

  if (openDate < today) {
    return { field: 'opensAt', message: SURVEY_ERROR_MESSAGES.OPENS_IN_THE_PAST };
  }
  if (closeDate <= openDate) {
    return { field: 'closesAt', message: SURVEY_ERROR_MESSAGES.CLOSES_BEFORE_OPENS };
  }
  return null;
}
