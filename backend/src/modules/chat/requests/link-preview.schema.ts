import { z } from 'zod';

export const linkPreviewQuerySchema = z
  .object({
    url: z
      .string({ error: 'La URL es obligatoria' })
      .trim()
      .min(1, 'La URL no puede estar vacía')
      .url('El formato de la URL no es válido')
      .refine(
        (val) => val.startsWith('http://') || val.startsWith('https://'),
        {
          message: 'Solo se permiten enlaces con protocolo http o https',
        },
      ),
  })
  .strict();

export type LinkPreviewQuery = z.infer<typeof linkPreviewQuerySchema>;
export type LinkPreviewQueryDto = LinkPreviewQuery;

