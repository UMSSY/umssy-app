import { z } from 'zod';

import { resolveEducationInstitution } from '../utils/resolve-education-institution.js';

export const educationIdSchema = z.uuid();
export const institutionSchema = z.string().trim().min(1)
  .refine((value) => resolveEducationInstitution(value) !== undefined, 'Selecciona una universidad de la lista permitida.')
  .transform((value) => resolveEducationInstitution(value) ?? value);
export const degreeSchema = z.string().trim().min(1);
export const educationDateSchema = z.iso
  .date()
  .refine((value) => value >= '1940-01-01', 'Fecha inválida.')
  .transform((value) => new Date(value));
export const educationDescriptionSchema = z
  .string()
  .max(400)
  .trim()
  .nullable()
  .optional();
