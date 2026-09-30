import { z } from 'zod';
import {
  ABOUT_ME_MAX_LENGTH,
  ABOUT_ME_MIN_LENGTH,
  HEADLINE_MAX_LENGTH,
  INTERESTED_OPPORTUNITIES_MAX_LENGTH,
  requiredText,
} from './profile-rules.js';

export const updatePresentationSchema = z.object({
  headline: requiredText('El titular profesional', 3, HEADLINE_MAX_LENGTH),
  aboutMe: requiredText(
    'El campo "Acerca de"',
    ABOUT_ME_MIN_LENGTH,
    ABOUT_ME_MAX_LENGTH,
  ),
  interestedOpportunities: z
    .string()
    .trim()
    .max(
      INTERESTED_OPPORTUNITIES_MAX_LENGTH,
      `Las oportunidades de interés no pueden superar los ${INTERESTED_OPPORTUNITIES_MAX_LENGTH} caracteres.`,
    )
    .nullish()
    .transform((value) => (value ? value : null)),
});

export type UpdatePresentationDto = z.infer<typeof updatePresentationSchema>;
