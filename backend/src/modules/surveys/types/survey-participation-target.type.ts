import type { Prisma } from '../../../prisma/client.js';
import type { SURVEY_PARTICIPATION_TARGET_SELECT } from '../constants/survey-participation.constants.js';

export type SurveyParticipationTarget = Prisma.SurveyGetPayload<{
  select: typeof SURVEY_PARTICIPATION_TARGET_SELECT;
}>;
