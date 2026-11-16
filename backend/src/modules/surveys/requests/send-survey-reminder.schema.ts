import { z } from 'zod';

export const sendSurveyReminderSchema = z.strictObject({}).default({});

export type SendSurveyReminderRequest = z.infer<typeof sendSurveyReminderSchema>;
