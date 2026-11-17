import { z } from 'zod';

export const radarPublishedPayloadSchema = z
  .object({
    radarVersion: z.string().regex(/^[1-9]\d*$/),
    publishedAt: z.string().datetime(),
  })
  .strict();
