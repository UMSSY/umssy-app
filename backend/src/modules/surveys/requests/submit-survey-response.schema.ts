import { z } from 'zod';

export const submitSurveyAnswerItemSchema = z.object({
  questionId: z.string().uuid(),
  optionIds: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos una opción'),
});

export const submitSurveyResponseSchema = z.object({
  answers: z.array(submitSurveyAnswerItemSchema).min(1, 'Debe responder al menos una pregunta'),
});

export type SubmitSurveyResponseRequest = z.infer<typeof submitSurveyResponseSchema>;
