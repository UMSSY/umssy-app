import { z } from 'zod';
import type { SendSurveyReminderRequest } from '../types/send-survey-reminder-request.type.js';

export const sendSurveyReminderSchema = z.strictObject({}).default({});

export type { SendSurveyReminderRequest };
