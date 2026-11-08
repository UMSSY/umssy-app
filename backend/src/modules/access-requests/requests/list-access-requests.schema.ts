import { z } from 'zod';
import { INBOX_PERIODS } from '../constants/inbox-filters.constants.js';
import { LIST_STATUSES } from '../constants/list-access-requests.constants.js';
import { CAREER } from '../types/career.enum.js';
import { VALIDATION_FILTERS } from '../constants/automatic-validation.constants.js';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export const listAccessRequestsQuerySchema = z.object({
  status: z.enum(LIST_STATUSES, { error: 'El estado no es válido' }).optional(),
  search: z.preprocess(
    emptyToUndefined,
    z
      .string({ error: 'La búsqueda debe ser un texto' })
      .trim()
      .min(2, `La búsqueda debe tener al menos 2 caracteres`)
      .max(100, `La búsqueda no puede superar 100 caracteres`)
      .optional(),
  ),
  career: z.preprocess(
    emptyToUndefined,
    z
      .enum(Object.values(CAREER), { error: 'La carrera no es válida' })
      .optional(),
  ),
  validation: z.preprocess(
    emptyToUndefined,
    z
      .enum(VALIDATION_FILTERS, {
        error: 'La validación automática no es válida',
      })
      .optional(),
  ),
  period: z
    .enum(INBOX_PERIODS, { error: 'El período no es válido' })
    .default('all'),
  page: z.coerce
    .number({ error: 'La página debe ser un número' })
    .int('La página debe ser un número entero')
    .min(1, 'La página debe ser mayor o igual a 1')
    .default(1),
  limit: z.coerce
    .number({ error: 'El límite debe ser un número' })
    .int('El límite debe ser un número entero')
    .min(1, 'El límite debe ser mayor o igual a 1')
    .max(50, `El límite no puede superar 50`)
    .default(10),
});

export type ListAccessRequestsQuery = z.infer<
  typeof listAccessRequestsQuerySchema
>;
