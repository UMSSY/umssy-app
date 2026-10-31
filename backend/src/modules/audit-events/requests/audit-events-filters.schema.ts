import { z } from 'zod';
import { toUtcIso } from '../../../common/utils/date-time.js';
import { MAX_AUDIT_SEARCH_LENGTH, MIN_AUDIT_SEARCH_LENGTH, SYSTEM_RESPONSIBLE_ID } from '../constants/audit-events.constants.js';
import { AUDIT_ACTION } from '../types/audit-action.enum.js';

const RESPONSIBLE_ERROR = 'El responsable no es válido';

const emptyToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);

const isCalendarDate = (value: string) => {
  try {
    toUtcIso(value, '00:00');
    return true;
  } catch {
    return false;
  }
};

const calendarDate = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string({ error: `La fecha ${label} debe ser un texto` })
      .regex(/^\d{4}-\d{2}-\d{2}$/, `La fecha ${label} debe tener el formato AAAA-MM-DD`)
      .refine(isCalendarDate, `La fecha ${label} no existe`)
      .optional(),
  );

export const auditEventsFiltersShape = {
  search: z.preprocess(
    emptyToUndefined,
    z
      .string({ error: 'La búsqueda debe ser un texto' })
      .trim()
      .min(MIN_AUDIT_SEARCH_LENGTH, `La búsqueda debe tener al menos ${MIN_AUDIT_SEARCH_LENGTH} caracteres`)
      .max(MAX_AUDIT_SEARCH_LENGTH, `La búsqueda no puede superar ${MAX_AUDIT_SEARCH_LENGTH} caracteres`)
      .optional(),
  ),
  action: z.preprocess(emptyToUndefined, z.enum(Object.values(AUDIT_ACTION), { error: 'La acción no es válida' }).optional()),
  responsibleId: z.preprocess(
    emptyToUndefined,
    z.union([z.literal(SYSTEM_RESPONSIBLE_ID), z.uuid({ error: RESPONSIBLE_ERROR })], { error: RESPONSIBLE_ERROR }).optional(),
  ),
  from: calendarDate('inicial'),
  to: calendarDate('final'),
};

// El periodo se compara como texto AAAA-MM-DD, que ordena igual que las fechas
export const hasValidPeriod = (value: { from?: string; to?: string }) => !value.from || !value.to || value.from <= value.to;

export const INVALID_PERIOD_ISSUE = { path: ['to'], message: 'La fecha final no puede ser anterior a la fecha inicial' };

export const auditEventsFiltersSchema = z.object(auditEventsFiltersShape).refine(hasValidPeriod, INVALID_PERIOD_ISSUE);

export type AuditEventsFiltersQuery = z.infer<typeof auditEventsFiltersSchema>;
