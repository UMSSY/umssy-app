import { z } from 'zod';
import { HEATMAP_TYPES } from '../constants/heatmap.constants.js';

export const heatmapParamsSchema = z.object({
  type: z.enum(HEATMAP_TYPES, {
    message: 'El tipo de mapa de calor no es válido',
  }),
});
