import type { z } from 'zod';
import type { sendSurveyReminderSchema } from '../requests/send-survey-reminder.schema.js';

export type SendSurveyReminderRequest = z.infer<typeof sendSurveyReminderSchema>;
