
import { z } from 'zod';

export const sendConnectionRequestSchema = z
  .object({
    receiverId: z
      .string({ error: 'El ID del destinatario es obligatorio' })
      .uuid('El ID del destinatario no es válido'),
  })
  .strict();

export type SendConnectionRequestDto = z.infer<typeof sendConnectionRequestSchema>;