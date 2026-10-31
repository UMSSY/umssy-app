
import { z } from 'zod';

export const joinEventChatSchema = z
  .object({
    eventId: z
      .string({ error: 'El ID del evento es obligatorio' })
      .uuid('El ID del evento no es válido'),
  })
  .strict();

export type JoinEventChatDto = z.infer<typeof joinEventChatSchema>;