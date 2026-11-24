import type { z } from 'zod';
import type { heatmapExportQuerySchema } from '../requests/heatmap-export-query.schema.js';

export type HeatmapExportQuery = z.infer<typeof heatmapExportQuerySchema>;
