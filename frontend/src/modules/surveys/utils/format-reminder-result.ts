import { SURVEY_PARTICIPATION_TEXT } from "../constants/survey-participation.constants";
import type { SurveyReminderResult } from "../types/survey-reminder-result.types";

export function formatReminderResult({ emailsDelivered, emailsFailed }: SurveyReminderResult): string {
  const summary = SURVEY_PARTICIPATION_TEXT.reminderSent(emailsDelivered);
  return emailsFailed > 0 ? `${summary}${SURVEY_PARTICIPATION_TEXT.reminderPartial(emailsFailed)}` : summary;
}
