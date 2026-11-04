import { z } from 'zod';
import { ACADEMIC_PERIOD_PATTERN } from '../../reports/utils/academic-period.js';
import { SURVEY_VALIDATION_MESSAGES } from '../constants/survey.constants.js';

export const surveyStatisticsQuerySchema = z.object({
  period: z
    .string()
    .trim()
    .regex(
      ACADEMIC_PERIOD_PATTERN,
      SURVEY_VALIDATION_MESSAGES.INVALID_STATISTICS_PERIOD,
    )
    .optional(),
});

export type SurveyStatisticsQuery = z.infer<typeof surveyStatisticsQuerySchema>;
