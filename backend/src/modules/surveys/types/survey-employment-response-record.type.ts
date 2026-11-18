import type { Prisma } from '../../../prisma/client.js';
import type { SURVEY_EMPLOYMENT_RESPONSE_SELECT } from '../constants/survey-employment.constants.js';

export type SurveyEmploymentResponseRecord = Prisma.SurveyResponseGetPayload<{
  select: typeof SURVEY_EMPLOYMENT_RESPONSE_SELECT;
}>;
