import type { z } from 'zod';
import type { surveyAlertConfigSchema } from '../requests/survey-alert-config.schema.js';

export type SurveyAlertConfigDto = z.infer<typeof surveyAlertConfigSchema>;
