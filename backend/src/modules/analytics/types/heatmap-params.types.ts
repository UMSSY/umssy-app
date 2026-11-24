import type { z } from 'zod';
import type { heatmapParamsSchema } from '../requests/heatmap-params.schema.js';

export type HeatmapParams = z.infer<typeof heatmapParamsSchema>;
