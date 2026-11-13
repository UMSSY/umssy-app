import { z } from 'zod';
import { HEATMAP_TYPES } from '../constants/heatmap.constants.js';

export const heatmapParamsSchema = z.object({
  type: z.enum(HEATMAP_TYPES, {
    message: 'El tipo de mapa de calor no es válido',
  }),
});

const timestampSchema = z.iso.datetime({
  offset: true,
  message: 'La fecha debe tener formato ISO 8601 con zona horaria',
});

export const heatmapQuerySchema = z
  .object({
    careerId: z.uuid({ message: 'La carrera no es válida' }).optional(),
    promotion: z.coerce
      .number()
      .int({ message: 'La promoción debe ser un año entero' })
      .min(2000, { message: 'La promoción no es válida' })
      .max(2100, { message: 'La promoción no es válida' })
      .optional(),
    year: z.coerce
      .number()
      .int({ message: 'La gestión debe ser un año entero' })
      .min(2000, { message: 'La gestión debe ser posterior al año 2000' })
      .max(2100, { message: 'La gestión no es válida' })
      .optional(),
    month: z.coerce
      .number()
      .int({ message: 'El mes debe ser un número entero' })
      .min(1, { message: 'El mes debe estar entre 1 y 12' })
      .max(12, { message: 'El mes debe estar entre 1 y 12' })
      .optional(),
    startTimestamp: timestampSchema.optional(),
    endTimestamp: timestampSchema.optional(),
  })
  .refine(
    (query) =>
      (query.startTimestamp === undefined) ===
      (query.endTimestamp === undefined),
    {
      message: 'El inicio y el fin del rango deben enviarse juntos',
      path: ['endTimestamp'],
    },
  );

export type HeatmapParams = z.infer<typeof heatmapParamsSchema>;
export type HeatmapQuery = z.infer<typeof heatmapQuerySchema>;
