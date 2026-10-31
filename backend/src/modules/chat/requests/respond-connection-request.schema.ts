
import { z } from 'zod';

export const respondConnectionRequestSchema = z
  .object({
    status: z.enum(['ACCEPTED', 'REJECTED'], {
      error: 'El estado debe ser ACCEPTED o REJECTED',
    }),
  })
  .strict();

export type RespondConnectionRequestDto = z.infer<typeof respondConnectionRequestSchema>;