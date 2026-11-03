import { z } from 'zod';
import { ACADEMIC_PERIOD_PATTERN } from '../../reports/utils/academic-period.js';
import { SURVEY_VALIDATION_MESSAGES } from '../constants/survey.constants.js';

// Semestre a consultar (I-2026 / II-2026). Sin valor se consultan todas las respuestas.
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
