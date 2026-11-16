import { z } from 'zod';
import type { SurveyAlertConfigDto } from '../types/survey-alert-config-dto.type.js';

export const surveyAlertConfigSchema = z.object({
  enabled: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  threshold: z
    .number()
    .int('El umbral debe ser un número entero')
    .min(1, 'El umbral mínimo es 1 punto porcentual')
    .max(50, 'El umbral máximo es 50 puntos porcentuales'),
  questionIds: z.array(z.string()).nullable().optional(),
});

export type { SurveyAlertConfigDto };
