import type { Prisma } from '../../../prisma/client.js';
import type { SURVEY_REMINDER_RECIPIENT_SELECT } from '../constants/survey-participation.constants.js';

export type SurveyReminderRecipient = Prisma.UserGetPayload<{
  select: typeof SURVEY_REMINDER_RECIPIENT_SELECT;
}>;
