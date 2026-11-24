import type { z } from 'zod';
import type { heatmapQuerySchema } from '../requests/heatmap-query.schema.js';

export type HeatmapQuery = z.infer<typeof heatmapQuerySchema>;
