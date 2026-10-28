import { z } from 'zod';
import { DEFAULT_AUDIT_PAGE_SIZE, MAX_AUDIT_PAGE_SIZE } from '../constants/audit-events.constants.js';
import { auditEventsFiltersShape, hasValidPeriod, INVALID_PERIOD_ISSUE } from './audit-events-filters.schema.js';

export const listAuditEventsQuerySchema = z
  .object({
    ...auditEventsFiltersShape,
    page: z.coerce
      .number({ error: 'La página debe ser un número' })
      .int('La página debe ser un número entero')
      .min(1, 'La página debe ser mayor o igual a 1')
      .default(1),
    limit: z.coerce
      .number({ error: 'El límite debe ser un número' })
      .int('El límite debe ser un número entero')
      .min(1, 'El límite debe ser mayor o igual a 1')
      .max(MAX_AUDIT_PAGE_SIZE, `El límite no puede superar ${MAX_AUDIT_PAGE_SIZE}`)
      .default(DEFAULT_AUDIT_PAGE_SIZE),
  })
  .refine(hasValidPeriod, INVALID_PERIOD_ISSUE);

export type ListAuditEventsQuery = z.infer<typeof listAuditEventsQuerySchema>;
