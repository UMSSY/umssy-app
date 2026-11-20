import { z } from 'zod';
import { HEATMAP_EXPORT_FORMATS } from '../constants/heatmap-pdf.constants.js';

export const heatmapExportQuerySchema = z.object({
  format: z
    .enum(HEATMAP_EXPORT_FORMATS, {
      message: 'El formato de exportación no es válido',
    })
    .default('pdf'),
});
